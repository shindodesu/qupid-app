'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useUser } from '@/stores/auth'

export default function StudentIdUploadPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  // ファイル選択処理
  const handleFileSelect = (file: File) => {
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "ファイルサイズは5MB以下である必要があります",
        type: "error"
      })
      return
    }

    // ファイルタイプチェック
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: "エラー",
        description: "JPEGまたはPNG形式のファイルをアップロードしてください",
        type: "error"
      })
      return
    }

    setSelectedFile(file)

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // ファイル入力のハンドラ
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // ドラッグ&ドロップハンドラ
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // アップロード処理
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '学生証のアップロードに失敗しました')
      }

      return response.json()
    },
    onSuccess: (data) => {
      console.log('[StudentIdUpload] Upload successful:', data)
      toast({
        title: "アップロード完了",
        description: "学生証のアップロードが完了しました。確認をお待ちください。",
        type: "success"
      })
      // 確認待機ページへリダイレクト
      setTimeout(() => {
        router.push('/age-verification-pending')
      }, 1000)
    },
    onError: (error: any) => {
      console.error('[StudentIdUpload] Upload failed:', error)
      toast({
        title: "エラーが発生しました",
        description: error.message || '学生証のアップロードに失敗しました',
        type: "error"
      })
    }
  })

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "エラー",
        description: "ファイルを選択してください",
        type: "error"
      })
      return
    }
    uploadMutation.mutate(selectedFile)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">年齢確認</h1>
          <p className="text-neutral-600">
            安全なサービスを提供するため、学生証をアップロードしてください
          </p>
        </div>

        {/* アップロードエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-pink-500 bg-pink-50'
              : 'border-neutral-300 bg-neutral-50 hover:border-pink-400'
          }`}
        >
          <input
            type="file"
            id="file-input"
            accept="image/jpeg,image/png"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <p className="text-sm text-neutral-600">{selectedFile?.name}</p>
              <Button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl('')
                }}
                variant="secondary"
                className="w-full"
              >
                ファイルを選択しなおす
              </Button>
            </div>
          ) : (
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-4xl">📸</div>
                <p className="font-medium text-neutral-900">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-neutral-600">
                  またはクリックして選択
                </p>
                <p className="text-xs text-neutral-500 pt-2">
                  JPEG / PNG（5MB以下）
                </p>
              </div>
            </label>
          )}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 space-y-4 text-sm text-neutral-600">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 学生証について</h3>
            <ul className="space-y-1 text-blue-800">
              <li>• 学生証の顔写真と有効期限が明確に見えるように撮影してください</li>
              <li>• 生年月日が確認できる必要があります</li>
              <li>• 画像は鮮明で、暗すぎないものをお使いください</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🔒 プライバシーについて</h3>
            <p className="text-green-800">
              アップロードされた学生証は18歳以上であることの確認のためにのみ使用され、
              承認完了後は直ちに削除されます。
            </p>
          </div>
        </div>

        {/* アップロードボタン */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full mt-8 h-12 text-base font-semibold"
        >
          {uploadMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              アップロード中...
            </div>
          ) : (
            'アップロードする'
          )}
        </Button>

        {/* 戻るボタン */}
        <Button
          onClick={() => router.back()}
          variant="secondary"
          className="w-full mt-3"
        >
          戻る
        </Button>
      </div>
    </div>
  )
}
