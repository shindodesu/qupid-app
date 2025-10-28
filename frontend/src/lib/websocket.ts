/**
 * WebSocketクライアント
 * 
 * リアルタイムチャット機能のためのWebSocket接続を管理
 */

/**
 * クッキーを取得するヘルパー関数
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(new RegExp(
    '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
  ))
  return matches ? decodeURIComponent(matches[1]) : null
}

export type WebSocketMessage = {
  type: 'connection' | 'pong' | 'new_message' | 'typing'
  status?: string
  user_id?: number
  conversation_id?: number
  sender_id?: number
  message_id?: number
  content?: string
  message_type?: string
  created_at?: string
  is_typing?: boolean
  message?: string
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private url: string
  private token: string | null = null
  private handlers: Map<string, Set<WebSocketEventHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // 初期遅延: 1秒
  
  constructor() {
    // WebSocket URLを環境変数から取得
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    this.url = apiUrl.replace(/^http/, 'ws') + '/ws'
  }
  
  /**
   * WebSocket接続を確立
   */
  connect(token?: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected')
      return
    }
    
    // トークンを取得
    this.token = token || getCookie('access_token') || null
    
    if (!this.token) {
      console.error('[WebSocket] No token available')
      return
    }
    
    try {
      const wsUrl = `${this.url}?token=${this.token}`
      console.log('[WebSocket] Connecting to:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      this.scheduleReconnect()
    }
  }
  
  /**
   * WebSocket接続を切断
   */
  disconnect() {
    console.log('[WebSocket] Disconnecting...')
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.reconnectAttempts = 0
  }
  
  /**
   * メッセージを送信
   */
  send(message: Record<string, any>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('[WebSocket] Cannot send message: not connected')
    }
  }
  
  /**
   * タイピングインジケーターを送信
   */
  sendTyping(conversationId: number, isTyping: boolean) {
    this.send({
      type: 'typing',
      conversation_id: conversationId,
      is_typing: isTyping,
    })
  }
  
  /**
   * イベントハンドラーを登録
   */
  on(event: string, handler: WebSocketEventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }
  
  /**
   * イベントハンドラーを解除
   */
  off(event: string, handler: WebSocketEventHandler) {
    if (this.handlers.has(event)) {
      this.handlers.get(event)!.delete(handler)
    }
  }
  
  /**
   * 接続状態を取得
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
  
  // Private methods
  
  private handleOpen() {
    console.log('[WebSocket] Connected')
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000
    
    // Ping-Pongでキープアライブ
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // 30秒ごと
  }
  
  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      console.log('[WebSocket] Received:', message)
      
      // タイプごとにハンドラーを呼び出す
      if (this.handlers.has(message.type)) {
        this.handlers.get(message.type)!.forEach(handler => handler(message))
      }
      
      // 全イベントのハンドラーも呼び出す
      if (this.handlers.has('*')) {
        this.handlers.get('*')!.forEach(handler => handler(message))
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error)
    }
  }
  
  private handleError(event: Event) {
    console.error('[WebSocket] Error:', event)
  }
  
  private handleClose(event: CloseEvent) {
    console.log('[WebSocket] Closed:', event.code, event.reason)
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    
    // 自動再接続
    this.scheduleReconnect()
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached')
      return
    }
    
    if (this.reconnectTimeout) {
      return
    }
    
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // 指数バックオフ
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect(this.token || undefined)
    }, delay)
  }
}

// シングルトンインスタンス
export const wsClient = new WebSocketClient()

