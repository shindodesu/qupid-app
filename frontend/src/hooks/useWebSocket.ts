/**
 * useWebSocket Hook
 * 
 * WebSocket接続を管理し、メッセージの送受信を行う
 */

import { useEffect, useCallback, useState } from 'react'
import { wsClient, WebSocketMessage, WebSocketEventHandler } from '@/lib/websocket'
import { useAuthStore } from '@/stores/auth'

export const useWebSocket = () => {
  const { token, isAuthenticated } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    if (isAuthenticated && token) {
      // WebSocket接続を確立
      wsClient.connect(token)
      
      // 接続状態を監視
      const checkConnection = setInterval(() => {
        setIsConnected(wsClient.isConnected)
      }, 1000)
      
      return () => {
        clearInterval(checkConnection)
        wsClient.disconnect()
      }
    } else {
      wsClient.disconnect()
      setIsConnected(false)
    }
  }, [isAuthenticated, token])
  
  const send = useCallback((message: Record<string, any>) => {
    wsClient.send(message)
  }, [])
  
  const sendTyping = useCallback((conversationId: number, isTyping: boolean) => {
    wsClient.sendTyping(conversationId, isTyping)
  }, [])
  
  const subscribe = useCallback((event: string, handler: WebSocketEventHandler) => {
    wsClient.on(event, handler)
    
    return () => {
      wsClient.off(event, handler)
    }
  }, [])
  
  return {
    isConnected,
    send,
    sendTyping,
    subscribe,
  }
}


/**
 * useWebSocketMessage Hook
 * 
 * 特定のイベントタイプのメッセージを購読
 */
export const useWebSocketMessage = (
  event: string,
  handler: WebSocketEventHandler
) => {
  const { subscribe } = useWebSocket()
  
  useEffect(() => {
    return subscribe(event, handler)
  }, [event, handler, subscribe])
}





