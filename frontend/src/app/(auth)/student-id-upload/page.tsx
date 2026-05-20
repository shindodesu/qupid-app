'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useUser } from '@/stores/auth'

// APIベースURL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** 認証コードAPIレスポンスの型 */
interface VerificationCodeData {
  code: string
  expires_at: string
  expires_in_seconds: number
}

export default function StudentIdUploadPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // トークン取得ヘルパー
  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

  // === 認証コード取得 ===
  const {
    data: codeData,
    isLoading: isCodeLoading,
    refetch: refetchCode,
  } = useQuery<VerificationCodeData>({
    queryKey: ['verification-code'],
    queryFn: async () => {
      const token = getToken()
      const res = await fetch(`${API_BASE}/age-verification/verification-code`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('コードの取得に失敗しました')
      return res.json()
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  // 残り時間カウントダウン
  useEffect(() => {
    if (codeData) {
      setRemainingSeconds(codeData.expires_in_seconds)
    }
  }, [codeData])

  useEffect(() => {
    if (remainingSeconds <= 0) return
    const timer = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [remainingSeconds])

  // 残り時間フォーマット (mm:ss)
  const formatRemaining = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // === コード再発行 ===
  const reissueMutation = useMutation({
    mutationFn: async () => {
      const token = getToken()
      const res = await fetch(`${API_BASE}/age-verification/verification-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('コードの再発行に失敗しました')
      return res.json() as Promise<VerificationCodeData>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['verification-code'], data)
      setRemainingSeconds(data.expires_in_seconds)
      toast({ title: 'コードを再発行しました', type: 'success' })
    },
    onError: () => {
      toast({ title: 'エラー', description: 'コードの再発行に失敗しました', type: 'error' })
    },
  })

  // === ファイル選択処理 ===
  const handleFileSelect = useCallback(
    (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'エラー',
          description: 'ファイルサイズは5MB以下である必要があります',
          type: 'error',
        })
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({
          title: 'エラー',
          description: 'JPEGまたはPNG形式のファイルをアップロードしてください',
          type: 'error',
        })
        return
      }
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target?.result as string)
      reader.readAsDataURL(file)
    },
    [toast]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
  }

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
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
  }

  const handleRetake = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    // input をリセットしてから再度クリック（スマホカメラを再起動）
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // === アップロード処理 ===
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const token = getToken()
      const response = await fetch(`${API_BASE}/age-verification/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '学生証のアップロードに失敗しました')
      }
      return response.json()
    },
    onSuccess: (data) => {
      console.log('[StudentIdUpload] Upload successful:', data)
      toast({
        title: 'アップロード完了',
        description: '学生証のアップロードが完了しました。確認をお待ちください。',
        type: 'success',
      })
      setTimeout(() => router.push('/age-verification-pending'), 1000)
    },
    onError: (error: any) => {
      console.error('[StudentIdUpload] Upload failed:', error)
      toast({
        title: 'エラーが発生しました',
        description: error.message || '学生証のアップロードに失敗しました',
        type: 'error',
      })
    },
  })

  const handleUpload = () => {
    if (!selectedFile) {
      toast({ title: 'エラー', description: 'ファイルを選択してください', type: 'error' })
      return
    }
    uploadMutation.mutate(selectedFile)
  }

  // コードの色：残り時間が少ないと赤に
  const codeColorClass =
    remainingSeconds <= 60
      ? 'text-red-500'
      : remainingSeconds <= 180
      ? 'text-orange-400'
      : 'text-pink-500'

  // プログレスバーの割合
  const progressPercent = codeData
    ? Math.min(100, (remainingSeconds / (10 * 60)) * 100)
    : 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="w-full max-w-md">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">年齢確認</h1>
        </div>

        {/* ========== 撮影用認証コードカード ========== */}
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6 mb-6">
          {/* コード表示エリア */}
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-500 mb-3 tracking-wide uppercase">
              撮影用認証コード
            </p>

            {isCodeLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* 4桁コード */}
                <div
                  className={`text-7xl font-black tracking-[0.3em] mb-1 tabular-nums ${codeColorClass} transition-colors duration-500`}
                  aria-label={`認証コード: ${codeData?.code}`}
                >
                  {codeData?.code ?? '----'}
                </div>

                {/* プログレスバー */}
                <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-3 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      remainingSeconds <= 60
                        ? 'bg-red-400'
                        : remainingSeconds <= 180
                        ? 'bg-orange-400'
                        : 'bg-pink-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 残り時間 */}
                <p
                  className={`text-xs font-mono font-semibold mb-1 ${
                    remainingSeconds <= 60 ? 'text-red-500' : 'text-neutral-400'
                  }`}
                >
                  {remainingSeconds > 0
                    ? `残り ${formatRemaining(remainingSeconds)}`
                    : '期限切れ'}
                </p>
              </>
            )}

            {/* 有効期限注記 */}
            <p className="text-xs text-neutral-400 mt-1">
              ※ このコードは10分間のみ有効です。
            </p>
          </div>

          {/* 再発行ボタン */}
          <button
            id="reissue-code-button"
            onClick={() => reissueMutation.mutate()}
            disabled={reissueMutation.isPending || isCodeLoading}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-pink-200 bg-pink-50 text-pink-600 text-sm font-semibold hover:bg-pink-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reissueMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                再発行中...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                コードを再発行する
              </>
            )}
          </button>
        </div>

        {/* ========== 撮影手順の説明 ========== */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">📋 撮影手順</p>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed">
            <li>上の4桁のコードを紙に<strong>手書き</strong>してください。</li>
            <li>学生証の横にそのコードを並べて置いてください。</li>
            <li>2つが一緒に写るように撮影してください。</li>
          </ol>
        </div>

        {/* ========== アップロード / カメラエリア ========== */}
        {previewUrl ? (
          /* プレビュー表示 */
          <div className="bg-white rounded-2xl shadow-md border border-neutral-100 p-4">
            <p className="text-sm font-semibold text-neutral-600 mb-3 text-center">
              📷 撮影した写真を確認してください
            </p>
            <div className="relative rounded-xl overflow-hidden bg-neutral-900">
              <img
                src={previewUrl}
                alt="撮影プレビュー"
                className="w-full max-h-72 object-contain"
              />
            </div>
            <p className="text-xs text-neutral-400 text-center mt-2">
              {selectedFile?.name} &nbsp;•&nbsp;{' '}
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : ''}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                id="retake-photo-button"
                onClick={handleRetake}
                className="py-2.5 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-semibold hover:bg-neutral-50 active:scale-95 transition-all"
              >
                撮り直す
              </button>
              <button
                id="confirm-photo-button"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {uploadMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    送信中...
                  </span>
                ) : (
                  'これで送信する'
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ファイル選択 / カメラ起動エリア */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-pink-500 bg-pink-50 scale-[1.01]'
                : 'border-neutral-300 bg-neutral-50 hover:border-pink-400 hover:bg-pink-50/50'
            }`}
          >
            {/* スマホ用: カメラを直接起動する input */}
            <input
              ref={fileInputRef}
              type="file"
              id="file-input"
              accept="image/jpeg,image/png"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <label htmlFor="file-input" className="cursor-pointer block">
              <div className="space-y-3">
                <div className="text-5xl">📸</div>
                <p className="font-semibold text-neutral-800 text-base">
                  タップしてカメラで撮影
                </p>
                <p className="text-sm text-neutral-500">
                  または画像ファイルをドラッグ＆ドロップ
                </p>
                <p className="text-xs text-neutral-400 pt-1">
                  JPEG / PNG（5MB以下）
                </p>
              </div>
            </label>
          </div>
        )}

        {/* ========== プライバシー案内 ========== */}
        <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
          <h3 className="font-semibold text-green-900 mb-1">🔒 プライバシーについて</h3>
          <p className="text-green-800 text-xs leading-relaxed">
            アップロードされた学生証は18歳以上であることの確認のためにのみ使用され、
            承認完了後は直ちに削除されます。
          </p>
        </div>

        {/* 戻るボタン */}
        <Button
          onClick={() => router.back()}
          variant="secondary"
          className="w-full mt-4"
        >
          戻る
        </Button>
      </div>
    </div>
  )
}
