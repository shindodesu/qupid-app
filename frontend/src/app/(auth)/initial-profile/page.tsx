'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { InitialProfileData } from '@/types/user'
import { useAuthStore, useUser, useAuthLoading } from '@/stores/auth'

export default function InitialProfilePage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  const isLoading = useAuthLoading()
  const { updateUser } = useAuthStore()

  // プロフィールが既に完了している場合はホームへリダイレクト
  useEffect(() => {
    if (!isLoading && user?.profile_completed === true) {
      console.log('[InitialProfile] Profile already completed, redirecting to home')
      router.push('/home')
    }
  }, [user, isLoading, router])
  
  const [formData, setFormData] = useState<InitialProfileData>({
    display_name: '',
    birthday: '',
    gender: '',
    sexuality: '',
    looking_for: ''
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showSexualityModal, setShowSexualityModal] = useState(false)
  const [showLookingForModal, setShowLookingForModal] = useState(false)

  const completeProfileMutation = useMutation({
    mutationFn: async (data: InitialProfileData) => {
      console.log('[InitialProfile] Submitting profile data:', JSON.stringify(data, null, 2))
      console.log('[InitialProfile] Data types:', {
        display_name: typeof data.display_name,
        birthday: typeof data.birthday,
        gender: typeof data.gender,
        sexuality: typeof data.sexuality,
        looking_for: typeof data.looking_for
      })
      
      // プロフィール情報を登録
      const profileResult = await apiClient.completeInitialProfile(data)
      console.log('[InitialProfile] Profile registration successful:', profileResult)
      
      // アバター画像がある場合はアップロード
      if (avatarFile) {
        console.log('[InitialProfile] Uploading avatar...')
        const formData = new FormData()
        formData.append('file', avatarFile)
        
        const token = localStorage.getItem('auth-token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/upload/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
        
        if (!response.ok) {
          console.error('[InitialProfile] Avatar upload failed')
          throw new Error('アバター画像のアップロードに失敗しました')
        }
        
        console.log('[InitialProfile] Avatar upload successful')
      }
      
      return profileResult
    },
    onSuccess: (data) => {
      console.log('[InitialProfile] Complete profile success, user data:', data)
      
      // Zustandストアのユーザー情報を更新（プロフィール完了フラグを確実に設定）
      updateUser({
        ...data,
        profile_completed: true
      })
      
      console.log('[InitialProfile] User store updated')
      
      toast({
        title: "プロフィールを登録しました",
        description: "Qupidを始めましょう！",
        type: "success"
      })
      
      // 状態更新後にリダイレクト
      setTimeout(() => {
        console.log('[InitialProfile] Redirecting to home...')
        router.push('/home')
      }, 300)
    },
    onError: (error: any) => {
      console.error('[InitialProfile] Profile registration error:', error)
      
      // 既にプロフィール完了済みの場合はホームへリダイレクト
      if (error.message?.includes('Profile already completed')) {
        toast({
          title: "プロフィールは既に登録済みです",
          description: "ホームに移動します",
          type: "info"
        })
        setTimeout(() => {
          router.push('/home')
        }, 1000)
        return
      }
      
      toast({
        title: "エラーが発生しました",
        description: error.message || "プロフィールの登録に失敗しました",
        type: "error"
      })
    }
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "エラー",
          description: "ファイルサイズは10MB以下にしてください",
          type: "error"
        })
        return
      }
      
      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        toast({
          title: "エラー",
          description: "画像ファイルを選択してください",
          type: "error"
        })
        return
      }
      
      setAvatarFile(file)
      
      // プレビュー表示
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // バリデーション
    if (!formData.display_name || !formData.birthday || !formData.gender || !formData.sexuality || !formData.looking_for) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        type: "error"
      })
      return
    }

    completeProfileMutation.mutate(formData)
  }

  const handleSkip = () => {
    router.push('/profile')
  }

  const genderOptions = [
    '男性', '女性', 'ノンバイナリー', 'その他', '回答しない'
  ]

  const sexualityOptions = [
    'ストレート', 'ゲイ', 'レズビアン', 'バイセクシュアル', 'パンセクシュアル', 'アセクシュアル', 'その他', '回答しない'
  ]

  const lookingForOptions = [
    '恋愛関係', '友達', 'カジュアルな関係', '長期的な関係', 'その他'
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <button 
          onClick={handleSkip}
          className="text-red-500 text-sm font-medium"
        >
          Skip
        </button>
      </div>

      <div className="px-4 py-8">
        {/* プロフィール画像 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="プロフィール画像"
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <input
              type="file"
              id="avatar-input"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => document.getElementById('avatar-input')?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ニックネーム */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              ニックネーム
            </label>
            <Input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Grace"
              className="w-full"
              required
            />
          </div>

          {/* 生年月日 */}
          <div>
            <button
              type="button"
              onClick={() => {
                const dateInput = document.getElementById('birthday-input')
                if (dateInput) dateInput.showPicker()
              }}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.birthday ? new Date(formData.birthday).toLocaleDateString('ja-JP') : 'Choose birthday date'}
              </span>
            </button>
            <input
              id="birthday-input"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="hidden"
              required
            />
          </div>

          {/* 性別 */}
          <div>
            <button
              type="button"
              onClick={() => setShowGenderModal(true)}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.gender || 'Choose gender'}
              </span>
            </button>
          </div>

          {/* セクシュアリティ */}
          <div>
            <button
              type="button"
              onClick={() => setShowSexualityModal(true)}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.sexuality || 'Choose sexuality'}
              </span>
            </button>
          </div>

          {/* 探している関係 */}
          <div>
            <button
              type="button"
              onClick={() => setShowLookingForModal(true)}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.looking_for || 'I want to find ...'}
              </span>
            </button>
          </div>

          {/* 確認ボタン */}
          <Button
            type="submit"
            className="w-full bg-red-500 text-white py-4 rounded-lg font-medium"
            disabled={completeProfileMutation.isPending}
          >
            {completeProfileMutation.isPending ? '登録中...' : 'Confirm'}
          </Button>
        </form>
      </div>

      {/* 性別選択モーダル */}
      {showGenderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">性別を選択</h3>
            <div className="space-y-2">
              {genderOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, gender: option })
                    setShowGenderModal(false)
                  }}
                  className="w-full p-3 text-left hover:bg-gray-100 rounded-lg text-gray-900"
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowGenderModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-900"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* セクシュアリティ選択モーダル */}
      {showSexualityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">セクシュアリティを選択</h3>
            <div className="space-y-2">
              {sexualityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, sexuality: option })
                    setShowSexualityModal(false)
                  }}
                  className="w-full p-3 text-left hover:bg-gray-100 rounded-lg text-gray-900"
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowSexualityModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-900"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* 探している関係選択モーダル */}
      {showLookingForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">探している関係を選択</h3>
            <div className="space-y-2">
              {lookingForOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, looking_for: option })
                    setShowLookingForModal(false)
                  }}
                  className="w-full p-3 text-left hover:bg-gray-100 rounded-lg text-gray-900"
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowLookingForModal(false)}
              className="w-full mt-4 bg-gray-200 text-gray-900"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
