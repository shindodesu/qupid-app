class ApiClient {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }

  get defaults() {
    return {
      baseURL: this.baseURL,
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? 
      localStorage.getItem('auth-token') || 
      document.cookie.split(';').find(c => c.trim().startsWith('auth-token='))?.split('=')[1] : 
      null

    // ヘッダーの処理
    const existingHeaders = options.headers || {}
    const headersObj: Record<string, string> = {}
    
    // 既存のヘッダーをオブジェクトに変換
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, key) => {
        headersObj[key] = value
      })
    } else if (Array.isArray(existingHeaders)) {
      existingHeaders.forEach(([key, value]) => {
        headersObj[key] = value
      })
    } else if (existingHeaders) {
      Object.assign(headersObj, existingHeaders)
    }

    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    if (!(options.body instanceof FormData) && !headersObj['Content-Type']) {
      headersObj['Content-Type'] = 'application/json'
    }

    // トークンを追加
    if (token) {
      headersObj['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: headersObj,
    }

    console.log('API Request:', {
      url: `${this.baseURL}${endpoint}`,
      method: config.method || 'GET',
      headers: config.headers,
      hasToken: !!token
    })

    const response = await fetch(`${this.baseURL}${endpoint}`, config)

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      if (response.status === 401) {
        // 認証エラーの場合、トークンを削除
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
        }
        throw new Error('認証が必要です')
      }
      
      // エラーレスポンスの詳細を取得
      let errorMessage = `API Error: ${response.status}`
      try {
        const responseText = await response.text()
        console.error('[API] Error response text:', responseText)
        
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch (jsonError) {
          console.error('[API] Failed to parse error response as JSON:', jsonError)
          throw new Error(`${errorMessage} - ${responseText}`)
        }
        
        console.error('[API] Error data:', errorData)
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            // Pydanticのバリデーションエラー形式
            const validationErrors = errorData.detail.map((err: any) => 
              `${err.loc?.join('.') || 'field'}: ${err.msg}`
            ).join(', ')
            console.error('[API] Validation errors:', validationErrors)
            errorMessage = validationErrors
          }
        }
      } catch (e) {
        console.error('[API] Error processing error response:', e)
        // エラー処理中のエラーは、既に投げられているか、デフォルトメッセージを使用
      }
      
      throw new Error(errorMessage)
    }

    // responseTypeがblobの場合はBlobとして返す
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/octet-stream')) {
      return await response.blob() as T
    }

    try {
      const json = await response.json()
      return json
    } catch (jsonError) {
      console.error('[API] Failed to parse response as JSON:', jsonError)
      throw new Error('レスポンスの解析に失敗しました')
    }
  }

  // GET request
  async get<T>(endpoint: string, config?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...config })
  }

  // POST request
  async post<T>(endpoint: string, data?: any, config?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
    const options: RequestInit = {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...config,
    }
    
    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    if (!isFormData) {
      options.headers = {
        'Content-Type': 'application/json',
        ...(config?.headers || {}),
      }
    }
    
    return this.request<T>(endpoint, options)
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string, data?: any, config?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData
    const options: RequestInit = {
      method: 'DELETE',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...config,
    }
    
    // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
    if (!isFormData && data) {
      options.headers = {
        'Content-Type': 'application/json',
        ...(config?.headers || {}),
      }
    }
    
    return this.request<T>(endpoint, options)
  }

  // 認証関連のメソッド
  async login(email: string, password: string) {
    const response = await this.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    })
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', response.token)
    }
    
    return response
  }

  async logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
    }
  }

  // ユーザー関連のメソッド
  async getCurrentUser() {
    return this.get<any>('/users/me')
  }

  async updateProfile(data: any) {
    return this.put<any>('/users/me', data)
  }

  async completeInitialProfile(data: any) {
    return this.post<any>('/users/me/initial-profile', data)
  }

  // タグ関連のメソッド
  async getTags() {
    return this.get<any>('/tags')
  }

  async createTag(data: any) {
    return this.post<any>('/tags', data)
  }

  async getUserTags() {
    return this.get<any>('/users/me/tags')
  }

  async addUserTag(tagId: number) {
    return this.post<any>('/users/me/tags', { tag_id: tagId })
  }

  async removeUserTag(tagId: number) {
    return this.delete<any>(`/users/me/tags/${tagId}`)
  }

  // 検索関連のメソッド
  async searchUsers(params: any) {
    const searchParams = new URLSearchParams(params)
    return this.get<any>(`/users/search?${searchParams}`)
  }

  async getSuggestions() {
    return this.get<any>('/users/suggestions')
  }

  // いいね・マッチング関連のメソッド
  async sendLike(userId: number) {
    return this.post<any>('/likes', { liked_user_id: userId })
  }

  async getSentLikes() {
    return this.get<any>('/likes/sent')
  }

  async getReceivedLikes() {
    return this.get<any>('/likes/received')
  }

  async getMatches() {
    return this.get<any>('/matches')
  }

  async removeLike(userId: number) {
    return this.delete<any>(`/likes/${userId}`)
  }

  // チャット関連のメソッド
  async getConversations() {
    return this.get<any>('/conversations')
  }

  async createConversation(userId: number) {
    return this.post<any>('/conversations', { other_user_id: userId })
  }

  async getMessages(conversationId: number) {
    return this.get<any>(`/conversations/${conversationId}/messages`)
  }

  async sendMessage(conversationId: number, content: string) {
    return this.post<any>(`/conversations/${conversationId}/messages`, { content })
  }

  async markMessageAsRead(conversationId: number, messageId: number) {
    return this.put<any>(`/conversations/${conversationId}/messages/${messageId}/read`)
  }

  // セーフティ関連のメソッド
  async reportUser(data: any) {
    return this.post<any>('/reports', data)
  }

  async blockUser(userId: number) {
    return this.post<any>('/blocks', { blocked_user_id: userId })
  }

  async getBlocks() {
    return this.get<any>('/blocks/my')
  }

  async unblockUser(userId: number) {
    return this.delete<any>(`/blocks/${userId}`)
  }
}

export const apiClient = new ApiClient()
