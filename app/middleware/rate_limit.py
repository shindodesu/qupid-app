"""
レート制限ミドルウェア
本番環境でメール送信やAPI呼び出しの乱用を防ぐ
"""

import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    シンプルなインメモリレート制限
    本番環境ではRedisなどの外部ストレージの使用を推奨
    """
    
    def __init__(self):
        # {client_id: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        # {client_id: {endpoint: count}}
        self.email_sends: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        # {client_id: timestamp}
        self.email_reset_time: Dict[str, float] = {}
    
    def _get_client_id(self, request: Request) -> str:
        """クライアントの識別子を取得（IPアドレスまたはユーザーID）"""
        # X-Forwarded-For ヘッダーをチェック（プロキシ経由の場合）
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # 直接接続の場合
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _clean_old_requests(self, client_id: str, window_seconds: int):
        """古いリクエストを削除"""
        current_time = time.time()
        self.requests[client_id] = [
            (timestamp, endpoint)
            for timestamp, endpoint in self.requests[client_id]
            if current_time - timestamp < window_seconds
        ]
    
    def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60
    ) -> Tuple[bool, int]:
        """
        レート制限をチェック
        
        Args:
            request: FastAPIリクエスト
            max_requests: 時間窓内の最大リクエスト数
            window_seconds: 時間窓（秒）
            
        Returns:
            (制限内かどうか, 残りリクエスト数)
        """
        client_id = self._get_client_id(request)
        current_time = time.time()
        endpoint = request.url.path
        
        # 古いリクエストを削除
        self._clean_old_requests(client_id, window_seconds)
        
        # 現在の時間窓内のリクエスト数を数える
        request_count = len(self.requests[client_id])
        
        if request_count >= max_requests:
            logger.warning(
                f"レート制限超過: client={client_id}, "
                f"endpoint={endpoint}, count={request_count}"
            )
            return False, 0
        
        # リクエストを記録
        self.requests[client_id].append((current_time, endpoint))
        remaining = max_requests - request_count - 1
        
        return True, remaining
    
    def check_email_rate_limit(
        self,
        request: Request,
        max_emails: int = 10,
        window_seconds: int = 3600  # 1時間
    ) -> Tuple[bool, int]:
        """
        メール送信のレート制限をチェック
        
        Args:
            request: FastAPIリクエスト
            max_emails: 時間窓内の最大メール送信数
            window_seconds: 時間窓（秒）
            
        Returns:
            (制限内かどうか, 残りメール送信可能数)
        """
        client_id = self._get_client_id(request)
        current_time = time.time()
        
        # リセット時刻をチェック
        if client_id not in self.email_reset_time:
            self.email_reset_time[client_id] = current_time + window_seconds
            self.email_sends[client_id] = defaultdict(int)
        elif current_time >= self.email_reset_time[client_id]:
            # 時間窓が過ぎたのでリセット
            self.email_reset_time[client_id] = current_time + window_seconds
            self.email_sends[client_id] = defaultdict(int)
        
        # 現在のメール送信数を取得
        email_count = sum(self.email_sends[client_id].values())
        
        if email_count >= max_emails:
            reset_in = int(self.email_reset_time[client_id] - current_time)
            logger.warning(
                f"メール送信レート制限超過: client={client_id}, "
                f"count={email_count}, reset_in={reset_in}秒"
            )
            return False, 0
        
        # メール送信を記録
        endpoint = request.url.path
        self.email_sends[client_id][endpoint] += 1
        remaining = max_emails - email_count - 1
        
        return True, remaining
    
    def reset_client(self, request: Request):
        """特定のクライアントのレート制限をリセット（テスト用）"""
        client_id = self._get_client_id(request)
        if client_id in self.requests:
            del self.requests[client_id]
        if client_id in self.email_sends:
            del self.email_sends[client_id]
        if client_id in self.email_reset_time:
            del self.email_reset_time[client_id]
        logger.info(f"レート制限をリセット: client={client_id}")


# グローバルなレート制限インスタンス
rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, max_requests: int = 100):
    """
    レート制限ミドルウェア関数
    
    Args:
        request: FastAPIリクエスト
        max_requests: 1分あたりの最大リクエスト数
        
    Raises:
        HTTPException: レート制限を超えた場合
    """
    allowed, remaining = rate_limiter.check_rate_limit(
        request,
        max_requests=max_requests,
        window_seconds=60
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="リクエストが多すぎます。しばらくしてから再度お試しください。",
            headers={"Retry-After": "60"}
        )
    
    return remaining


async def email_rate_limit_middleware(request: Request, max_emails: int = 10):
    """
    メール送信レート制限ミドルウェア関数
    
    Args:
        request: FastAPIリクエスト
        max_emails: 1時間あたりの最大メール送信数
        
    Raises:
        HTTPException: レート制限を超えた場合
    """
    allowed, remaining = rate_limiter.check_email_rate_limit(
        request,
        max_emails=max_emails,
        window_seconds=3600
    )
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="メール送信の制限に達しました。1時間後に再度お試しください。",
            headers={"Retry-After": "3600"}
        )
    
    return remaining

