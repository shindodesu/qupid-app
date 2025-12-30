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
    gender: '',
    sexuality: '',
    looking_for: ''
  })
  
  const [selectedSexualities, setSelectedSexualities] = useState<string[]>([])
  const [isMultipleSexualityMode, setIsMultipleSexualityMode] = useState(false)
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([])
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showSexualityModal, setShowSexualityModal] = useState(false)
  const [showLookingForModal, setShowLookingForModal] = useState(false)
  
  // 「その他」の自由記述用の状態
  const [otherSexualityText, setOtherSexualityText] = useState('')
  const [otherLookingForText, setOtherLookingForText] = useState('')

  // 日本語から英語へのマッピング（保存用）
  const genderValueMap: Record<string, string> = {
    '男性': 'male',
    '女性': 'female',
    'インターセックス': 'inter_sex',
  }
  
  const sexualityValueMap: Record<string, string> = {
    'ゲイ': 'gay',
    'レズビアン': 'lesbian',
    'バイセクシュアル': 'bisexual',
    'トランスジェンダー': 'transgender',
    'パンセクシュアル': 'pansexual',
    'アセクシュアル': 'asexual',
    'その他': 'other',
    '回答しない': 'prefer_not_to_say',
  }
  
  const lookingForValueMap: Record<string, string> = {
    '恋愛関係': 'dating',
    '友達': 'friends',
    'カジュアルな関係': 'casual',
    '長期的な関係': 'long_term',
    'その他': 'other',
  }

  const completeProfileMutation = useMutation({
    mutationFn: async (data: InitialProfileData) => {
      console.log('[InitialProfile] Submitting profile data:', JSON.stringify(data, null, 2))
      console.log('[InitialProfile] Data types:', {
        display_name: typeof data.display_name,
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
      
      // 状態更新後に心理的安全性の説明ページにリダイレクト
      setTimeout(() => {
        console.log('[InitialProfile] Redirecting to safety intro...')
        router.push('/safety-intro')
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
    
    console.log('[InitialProfile] Form submit triggered', formData)
    
    // バリデーション（表示名のみ必須、その他は任意）
    if (!formData.display_name) {
      console.log('[InitialProfile] Validation failed', {
        display_name: formData.display_name,
        gender: formData.gender,
        sexuality: formData.sexuality,
        looking_for: formData.looking_for
      })
      toast({
        title: "入力エラー",
        description: "ニックネームを入力してください",
        type: "error"
      })
      return
    }

    // 保存前に日本語の値を英語に変換
    const dataToSave = {
      ...formData,
      gender: formData.gender ? (genderValueMap[formData.gender] || formData.gender) : '',
      sexuality: formData.sexuality ? (() => {
        // 複数のセクシュアリティが選択されている場合
        if (formData.sexuality.includes(', ')) {
          return formData.sexuality.split(', ').map(s => {
            if (s.startsWith('その他:')) {
              return `other: ${s.replace('その他: ', '')}`
            }
            return sexualityValueMap[s] || s
          }).join(',')
        }
        // 「その他:」で始まる場合
        if (formData.sexuality.startsWith('その他:')) {
          return `other: ${formData.sexuality.replace('その他: ', '')}`
        }
        return sexualityValueMap[formData.sexuality] || formData.sexuality
      })() : '',
      looking_for: formData.looking_for ? (() => {
        if (formData.looking_for.startsWith('その他:')) {
          return `other: ${formData.looking_for.replace('その他: ', '')}`
        }
        return lookingForValueMap[formData.looking_for] || formData.looking_for
      })() : '',
    }

    console.log('[InitialProfile] Validation passed, submitting...', dataToSave)
    completeProfileMutation.mutate(dataToSave)
  }

  const genderOptions = [
    '男性', '女性', 'インターセックス'
  ]

  const sexualityOptions = [
    'ゲイ', 'レズビアン', 'バイセクシュアル', 'トランスジェンダー', 'パンセクシュアル', 'アセクシュアル', 'その他', '回答しない'
  ]

  const lookingForOptions = [
    '恋愛関係', '友達', 'カジュアルな関係', '長期的な関係', 'その他'
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-center p-4">
        <h1 className="text-xl font-bold text-gray-900">プロフィール登録</h1>
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
              placeholder="ニックネームを入力"
              className="w-full"
              required
            />
          </div>

          {/* 体の性別 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              体の性別
            </label>
            <button
              type="button"
              onClick={() => setShowGenderModal(true)}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.gender || '体の性別を選択'}
              </span>
            </button>
            <p className="mt-2 text-sm text-gray-500">
              記入は任意ですが、記入した方がマッチ率が上がります。
            </p>
          </div>

          {/* セクシュアリティ */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              セクシュアリティ
            </label>
            <button
              type="button"
              onClick={() => {
                // セクシャリティとしてトランスジェンダーを選択している場合、複数選択モードにする
                const isTransgender = formData.sexuality === 'トランスジェンダー' || 
                  (formData.sexuality ? formData.sexuality.includes('トランスジェンダー') : false)
                setIsMultipleSexualityMode(isTransgender)
                if (isTransgender && formData.sexuality) {
                  setSelectedSexualities(formData.sexuality.split(', ').filter(s => s))
                } else {
                  setSelectedSexualities([])
                }
                setShowSexualityModal(true)
              }}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.sexuality || 'セクシュアリティを選択'}
              </span>
            </button>
            <p className="mt-2 text-sm text-gray-500">
              記入は任意ですが、記入した方がマッチ率が上がります。
            </p>
          </div>

          {/* 探している関係 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              探している関係
            </label>
            <button
              type="button"
              onClick={() => {
                // 複数選択モードで開く
                if (formData.looking_for) {
                  setSelectedLookingFor(formData.looking_for.split(', ').filter(s => s))
                } else {
                  setSelectedLookingFor([])
                }
                setShowLookingForModal(true)
              }}
              className="w-full p-4 bg-pink-100 rounded-lg text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">
                {formData.looking_for || '探している関係を選択'}
              </span>
            </button>
            <p className="mt-2 text-sm text-gray-500">
              記入は任意ですが、記入した方がマッチ率が上がります。
            </p>
          </div>

          {/* 確認ボタン */}
          <Button
            type="submit"
            className="w-full bg-red-500 text-white py-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
            disabled={completeProfileMutation.isPending}
          >
            {completeProfileMutation.isPending ? '登録中...' : '確認'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          ※ これらの情報は後からプライバシー設定で非公開にすることもできます。
        </p>
      </div>

      {/* 体の性別選択モーダル */}
      {showGenderModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowGenderModal(false)}
        >
          <div 
            className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900">体の性別を選択</h3>
            <div className="space-y-2">
              {genderOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, gender: option })
                    setShowGenderModal(false)
                  }}
                  className={`w-full p-3 text-left hover:bg-gray-100 rounded-lg text-gray-900 ${
                    formData.gender === option ? 'bg-pink-100 text-red-500 font-medium' : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowGenderModal(false)
                }}
                className="w-full bg-gray-200 text-gray-900"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* セクシュアリティ選択モーダル */}
      {showSexualityModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowSexualityModal(false)}
        >
          <div 
            className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {isMultipleSexualityMode ? 'セクシュアリティを選択（複数可）' : 'セクシュアリティを選択'}
            </h3>
            <div className="space-y-2">
              {sexualityOptions.map((option) => {
                const isSelected = isMultipleSexualityMode 
                  ? selectedSexualities.includes(option)
                  : formData.sexuality === option || formData.sexuality?.startsWith('その他')
                
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === 'その他') {
                        // 「その他」の場合は入力欄を表示するため、モーダルを開いたままにする
                        if (isMultipleSexualityMode) {
                          if (!selectedSexualities.includes('その他')) {
                            setSelectedSexualities([...selectedSexualities, 'その他'])
                          }
                        } else {
                          setFormData({ ...formData, sexuality: 'その他' })
                          setOtherSexualityText('')
                        }
                      } else if (isMultipleSexualityMode) {
                        const newSelection = isSelected
                          ? selectedSexualities.filter(s => s !== option && s !== 'その他' && !s.startsWith('その他'))
                          : [...selectedSexualities.filter(s => s !== 'その他' && !s.startsWith('その他')), option]
                        setSelectedSexualities(newSelection)
                        setFormData({ ...formData, sexuality: newSelection.join(', ') })
                        setOtherSexualityText('')
                      } else {
                        // トランスジェンダーを選択した場合は複数選択モードに切り替える
                        if (option === 'トランスジェンダー') {
                          setSelectedSexualities(['トランスジェンダー'])
                          setIsMultipleSexualityMode(true)
                          setFormData({ ...formData, sexuality: 'トランスジェンダー' })
                        } else {
                          setFormData({ ...formData, sexuality: option })
                          setOtherSexualityText('')
                          setShowSexualityModal(false)
                        }
                      }
                    }}
                    className={`w-full p-3 text-left hover:bg-gray-100 rounded-lg ${
                      isSelected && option !== 'その他' && !formData.sexuality?.startsWith('その他') ? 'bg-pink-100 text-red-500 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {isMultipleSexualityMode && option !== 'その他' && (
                      <span className="mr-2">{isSelected ? '✓' : '○'}</span>
                    )}
                    {option}
                  </button>
                )
              })}
            </div>
            {(formData.sexuality === 'その他' || selectedSexualities.includes('その他')) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  具体的に入力してください
                </label>
                <Input
                  type="text"
                  value={otherSexualityText}
                  onChange={(e) => {
                    setOtherSexualityText(e.target.value)
                    const otherText = e.target.value ? `その他: ${e.target.value}` : 'その他'
                    if (isMultipleSexualityMode) {
                      const otherIndex = selectedSexualities.findIndex(s => s === 'その他' || s.startsWith('その他'))
                      const newSelection = otherIndex >= 0
                        ? [...selectedSexualities.filter((_, i) => i !== otherIndex), otherText]
                        : [...selectedSexualities, otherText]
                      setSelectedSexualities(newSelection)
                      setFormData({ ...formData, sexuality: newSelection.join(', ') })
                    } else {
                      setFormData({ ...formData, sexuality: otherText })
                    }
                  }}
                  placeholder="例: クエスチョニングなど"
                  className="w-full"
                  autoFocus
                />
              </div>
            )}
            {isMultipleSexualityMode && (
              <div className="mt-4 text-sm text-gray-600">
                選択中: {selectedSexualities.length > 0 ? selectedSexualities.map(s => s.startsWith('その他') ? 'その他' : s).join(', ') : 'なし'}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {isMultipleSexualityMode && (
                <Button
                  onClick={() => {
                    if (selectedSexualities.includes('その他') && !otherSexualityText.trim()) {
                      // 「その他」が選択されているが入力がない場合は確定できない
                      return
                    }
                    setFormData({ ...formData, sexuality: selectedSexualities.join(', ') })
                    setShowSexualityModal(false)
                    setIsMultipleSexualityMode(false)
                    setSelectedSexualities([])
                    setOtherSexualityText('')
                  }}
                  className="flex-1 bg-red-500 text-white"
                  disabled={selectedSexualities.includes('その他') && !otherSexualityText.trim()}
                >
                  確定
                </Button>
              )}
              {(formData.sexuality === 'その他' || selectedSexualities.includes('その他')) && !isMultipleSexualityMode && (
                <Button
                  onClick={() => {
                    if (otherSexualityText.trim()) {
                      setShowSexualityModal(false)
                    }
                  }}
                  className="flex-1 bg-red-500 text-white"
                  disabled={!otherSexualityText.trim()}
                >
                  確定
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowSexualityModal(false)
                  setIsMultipleSexualityMode(false)
                  setSelectedSexualities([])
                  if ((formData.sexuality === 'その他' || selectedSexualities.includes('その他')) && !otherSexualityText.trim()) {
                    setFormData({ ...formData, sexuality: '' })
                  }
                  setOtherSexualityText('')
                }}
                className={`${(formData.sexuality === 'その他' || selectedSexualities.includes('その他')) || isMultipleSexualityMode ? 'flex-1' : 'w-full'} bg-gray-200 text-gray-900`}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 探している関係選択モーダル */}
      {showLookingForModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowLookingForModal(false)}
        >
          <div 
            className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900">探している関係を選択（複数可）</h3>
            <div className="space-y-2">
              {lookingForOptions.map((option) => {
                const isSelected = selectedLookingFor.includes(option)
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === 'その他') {
                        // 「その他」の場合は入力欄を表示するため、モーダルを開いたままにする
                        if (!selectedLookingFor.includes('その他')) {
                          setSelectedLookingFor([...selectedLookingFor, 'その他'])
                        }
                      } else {
                        const newSelection = isSelected
                          ? selectedLookingFor.filter(s => s !== option && s !== 'その他' && !s.startsWith('その他'))
                          : [...selectedLookingFor.filter(s => s !== 'その他' && !s.startsWith('その他')), option]
                        setSelectedLookingFor(newSelection)
                        setFormData({ ...formData, looking_for: newSelection.join(', ') })
                        setOtherLookingForText('')
                      }
                    }}
                    className={`w-full p-3 text-left hover:bg-gray-100 rounded-lg text-gray-900 ${
                      isSelected && option !== 'その他' ? 'bg-pink-100 text-red-500 font-medium' : ''
                    }`}
                  >
                    <span className="mr-2">{isSelected ? '✓' : '○'}</span>
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedLookingFor.includes('その他') && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  具体的に入力してください
                </label>
                <Input
                  type="text"
                  value={otherLookingForText}
                  onChange={(e) => {
                    setOtherLookingForText(e.target.value)
                    const otherText = e.target.value ? `その他: ${e.target.value}` : 'その他'
                    const otherIndex = selectedLookingFor.findIndex(s => s === 'その他' || s.startsWith('その他'))
                    const newSelection = otherIndex >= 0
                      ? [...selectedLookingFor.filter((_, i) => i !== otherIndex), otherText]
                      : [...selectedLookingFor, otherText]
                    setSelectedLookingFor(newSelection)
                    setFormData({ ...formData, looking_for: newSelection.join(', ') })
                  }}
                  placeholder="例: ビジネスパートナーなど"
                  className="w-full"
                  autoFocus
                />
              </div>
            )}
            {selectedLookingFor.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                選択中: {selectedLookingFor.map(s => s.startsWith('その他') ? 'その他' : s).join(', ')}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  if (selectedLookingFor.includes('その他') && !otherLookingForText.trim()) {
                    // 「その他」が選択されているが入力がない場合は確定できない
                    return
                  }
                  if (selectedLookingFor.length === 0) {
                    toast({
                      title: "入力エラー",
                      description: "少なくとも1つ選択してください",
                      type: "error"
                    })
                    return
                  }
                  setFormData({ ...formData, looking_for: selectedLookingFor.join(', ') })
                  setShowLookingForModal(false)
                }}
                className="flex-1 bg-red-500 text-white"
                disabled={selectedLookingFor.includes('その他') && !otherLookingForText.trim() || selectedLookingFor.length === 0}
              >
                確定
              </Button>
              <Button
                onClick={() => {
                  setShowLookingForModal(false)
                  if (selectedLookingFor.includes('その他') && !otherLookingForText.trim()) {
                    const newSelection = selectedLookingFor.filter(s => s !== 'その他' && !s.startsWith('その他'))
                    setSelectedLookingFor(newSelection)
                    setFormData({ ...formData, looking_for: newSelection.length > 0 ? newSelection.join(', ') : '' })
                  }
                  setOtherLookingForText('')
                }}
                className="flex-1 bg-gray-200 text-gray-900"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
