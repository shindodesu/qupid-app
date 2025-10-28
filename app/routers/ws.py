"""
WebSocketエンドポイント

リアルタイムチャット機能のためのWebSocket接続を管理
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Set
import json
import logging

from app.db.session import get_db
from app.models.user import User
from app.models.message import Message
from app.models.conversation import Conversation, ConversationMember
from app.core.security import decode_token

router = APIRouter(prefix="/ws", tags=["websocket"])
logger = logging.getLogger(__name__)


# アクティブな接続を管理
class ConnectionManager:
    def __init__(self):
        # user_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        """ユーザーの接続を追加"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, user_id: int, websocket: WebSocket):
        """ユーザーの接続を削除"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(self, user_id: int, message: dict):
        """特定のユーザーにメッセージを送信"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # 切断されたconnectionを削除
            for conn in disconnected:
                self.disconnect(user_id, conn)
    
    async def broadcast_to_conversation(self, conversation_id: int, message: dict, db: AsyncSession):
        """会話の全メンバーにメッセージをブロードキャスト"""
        # 会話のメンバーを取得
        result = await db.execute(
            select(ConversationMember.user_id)
            .where(ConversationMember.conversation_id == conversation_id)
        )
        member_ids = [row[0] for row in result.all()]
        
        # 各メンバーに送信
        for user_id in member_ids:
            await self.send_personal_message(user_id, message)


manager = ConnectionManager()


async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """トークンからユーザーを取得"""
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            return None
        
        return user
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        return None


@router.websocket("")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket接続エンドポイント
    
    接続URL: ws://localhost:8000/ws?token=<JWT_TOKEN>
    """
    # トークン検証
    user = await get_current_user_from_token(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # 接続を確立
    await manager.connect(user.id, websocket)
    
    try:
        # オンライン状態を更新
        user.is_online = True
        await db.commit()
        
        # 接続成功メッセージ
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "user_id": user.id
        })
        
        # メッセージを受信し続ける
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # メッセージタイプに応じて処理
            if message_data.get("type") == "ping":
                # Ping-Pongでキープアライブ
                await websocket.send_json({"type": "pong"})
            
            elif message_data.get("type") == "typing":
                # タイピングインジケーター
                conversation_id = message_data.get("conversation_id")
                if conversation_id:
                    await manager.broadcast_to_conversation(
                        conversation_id,
                        {
                            "type": "typing",
                            "conversation_id": conversation_id,
                            "user_id": user.id,
                            "is_typing": message_data.get("is_typing", True)
                        },
                        db
                    )
            
            elif message_data.get("type") == "message":
                # 新しいメッセージ（実際の保存はHTTP APIで行う）
                # WebSocketでは通知のみ
                conversation_id = message_data.get("conversation_id")
                if conversation_id:
                    await manager.broadcast_to_conversation(
                        conversation_id,
                        {
                            "type": "new_message",
                            "conversation_id": conversation_id,
                            "sender_id": user.id,
                            "message": message_data.get("content")
                        },
                        db
                    )
    
    except WebSocketDisconnect:
        manager.disconnect(user.id, websocket)
        # オフライン状態に更新
        user.is_online = False
        await db.commit()
        logger.info(f"User {user.id} disconnected")
    
    except Exception as e:
        logger.error(f"WebSocket error for user {user.id}: {e}")
        manager.disconnect(user.id, websocket)
        # オフライン状態に更新
        try:
            user.is_online = False
            await db.commit()
        except:
            pass


# WebSocket通知用のヘルパー関数
async def notify_new_message(conversation_id: int, message: Message, db: AsyncSession):
    """新しいメッセージを会話メンバーに通知"""
    await manager.broadcast_to_conversation(
        conversation_id,
        {
            "type": "new_message",
            "conversation_id": conversation_id,
            "message_id": message.id,
            "sender_id": message.sender_id,
            "content": message.content,
            "message_type": message.message_type.value if message.message_type else "text",
            "created_at": message.created_at.isoformat() if message.created_at else None,
        },
        db
    )

