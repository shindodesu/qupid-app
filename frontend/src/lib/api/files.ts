import { apiClient } from './index'

// ファイルアップロードレスポンス
export interface FileUploadResponse {
  file_path: string
  file_size: number
  original_filename: string
  content_type: string
}

// ファイルAPIエラークラス
export class FileApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'FileApiError'
  }
}

// ファイル関連のAPI
export const fileApi = {
  /**
   * 音声ファイルをアップロード
   */
  async uploadVoiceFile(file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      return await apiClient.post<FileUploadResponse>(
        '/files/upload/voice',
        formData
      )
    } catch (error: any) {
      throw new FileApiError(
        error.message || '音声ファイルのアップロードに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * 画像ファイルをアップロード
   */
  async uploadImageFile(file: File): Promise<FileUploadResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      return await apiClient.post<FileUploadResponse>(
        '/files/upload/image',
        formData
      )
    } catch (error: any) {
      throw new FileApiError(
        error.message || '画像ファイルのアップロードに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ファイルをダウンロード
   */
  async downloadFile(filePath: string): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/files/download/${encodeURIComponent(filePath)}`
      )
      return response
    } catch (error: any) {
      throw new FileApiError(
        error.message || 'ファイルのダウンロードに失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ファイルを削除
   */
  async deleteFile(filePath: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(
        `/files/${encodeURIComponent(filePath)}`
      )
    } catch (error: any) {
      throw new FileApiError(
        error.message || 'ファイルの削除に失敗しました',
        error.status,
        error.code
      )
    }
  },

  /**
   * ファイルURLを生成
   */
  getFileUrl(filePath: string): string {
    return `${apiClient.defaults.baseURL}/files/download/${encodeURIComponent(filePath)}`
  },
}
