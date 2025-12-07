'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUser, useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/lib/utils/image'
import { ProfilePreviewCard, type ProfilePreviewData } from '@/components/features/profile/ProfilePreviewModal'
import { cn } from '@/lib/utils'
import { PageTransition, StaggerContainer, StaggerItem, AnimatedBackground } from '@/components/ui/PageTransition'
import { useTheme } from '@/hooks/useTheme'

export default function ProfilePage() {
  const router = useRouter()
  const user = useUser()
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const theme = useTheme()

  const [isEditing, setIsEditing] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [showSexualityModal, setShowSexualityModal] = useState(false)
  const [showGenderModal, setShowGenderModal] = useState(false)
  const [showLookingForModal, setShowLookingForModal] = useState(false)
  const [selectedSexualities, setSelectedSexualities] = useState<string[]>([])
  const [isMultipleSexualityMode, setIsMultipleSexualityMode] = useState(false)
  
  // 「その他」の自由記述用の状態
  const [otherSexualityText, setOtherSexualityText] = useState('')
  const [otherLookingForText, setOtherLookingForText] = useState('')

  const genderOptions = ['男性', '女性', 'インターセックス']
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    campus: '',
    faculty: '',
    grade: '',
    birthday: '',
    gender: '',
    sexuality: '',
    looking_for: '',
  })

  // 自分の情報取得（キャッシュを適切に保持しつつ、最新データを取得）
  const { 
    data: userData, 
    isLoading: isLoadingUserData,
    isError: isErrorUserData,
    error: userDataError,
    refetch: refetchUserData
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 30 * 1000, // 30秒間はstaleでない
    gcTime: 5 * 60 * 1000, // キャッシュを5分間保持（React Query v5）
    refetchOnMount: 'always', // マウント時は常に再取得
    refetchOnWindowFocus: true, // ウィンドウフォーカス時にも再取得
    retry: 2, // エラー時に2回再試行
    retryDelay: 1000, // 再試行の間隔は1秒
  })

  // 自分のタグ取得（previewProfileより前に定義する必要がある）
  const { data: tagsData } = useQuery({
    queryKey: ['user', 'me', 'tags'],
    queryFn: () => apiClient.getUserTags(),
  })

  // userDataまたはuserストアからデータを取得（フォールバック対応）
  const displayUserData = userData || user
  const previewProfile = useMemo<ProfilePreviewData | undefined>(() => {
    if (!displayUserData) return undefined
    return {
      id: displayUserData.id,
      display_name: displayUserData.display_name,
      bio: displayUserData.bio || undefined,
      avatar_url: displayUserData.avatar_url ? getAvatarUrl(displayUserData.avatar_url) : undefined,
      campus: displayUserData.campus || undefined,
      faculty: displayUserData.show_faculty ? displayUserData.faculty || undefined : undefined,
      grade: displayUserData.show_grade ? displayUserData.grade || undefined : undefined,
      sexuality: displayUserData.show_sexuality ? displayUserData.sexuality || undefined : undefined,
      looking_for: displayUserData.show_looking_for ? displayUserData.looking_for || undefined : undefined,
      tags: displayUserData.show_tags ? tagsData?.tags ?? [] : [],
    }
  }, [displayUserData, tagsData])

  // ページマウント時にクエリキャッシュを無効化（必要に応じて）
  useEffect(() => {
    // 初回マウント時のみ無効化（過度な再取得を防ぐ）
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    }, 100)
    return () => clearTimeout(timer)
  }, [queryClient])

  // userDataまたはuserストアが更新されたら、formDataを初期化
  useEffect(() => {
    const sourceData = userData || user
    if (sourceData) {
      const gender = sourceData.gender || ''
      const sexuality = sourceData.sexuality || ''
      const looking_for = sourceData.looking_for || ''
      
      // 「その他:」で始まる値を抽出
      if (sexuality.startsWith('その他:')) {
        setOtherSexualityText(sexuality.replace('その他: ', ''))
      } else {
        setOtherSexualityText('')
      }
      
      if (looking_for.startsWith('その他:')) {
        setOtherLookingForText(looking_for.replace('その他: ', ''))
      } else {
        setOtherLookingForText('')
      }
      
      setFormData({
        display_name: sourceData.display_name || '',
        bio: sourceData.bio || '',
        campus: sourceData.campus || '',
        faculty: sourceData.faculty || '',
        grade: sourceData.grade || '',
        birthday: sourceData.birthday || '',
        gender: gender,
        sexuality: sexuality,
        looking_for: looking_for,
      })
      // アバターURLが変わったらエラー状態をリセット
      setAvatarLoadError(false)
    }
  }, [userData, user])

  // 全タグ取得
  const { data: allTagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(),
  })

  // プロフィール更新
  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      setIsEditing(false)
    },
  })

  // タグ追加
  const addTagMutation = useMutation({
    mutationFn: (tagId: number) => apiClient.addUserTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'tags'] })
    },
  })

  // タグ削除
  const removeTagMutation = useMutation({
    mutationFn: (tagId: number) => apiClient.removeUserTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me', 'tags'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleLogout = async () => {
    console.log('[ProfilePage] Logging out...')
    try {
      await useAuthStore.getState().logout()
      console.log('[ProfilePage] Logout successful, redirecting to login')
      // ログアウト後、ログインページに強制リダイレクト（完全なページリロード）
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('[ProfilePage] Logout error:', error)
    }
  }

  // アバター画像アップロード
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/files/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'アバター画像のアップロードに失敗しました')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください')
        return
      }
      
      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }
      
      uploadAvatarMutation.mutate(file)
    }
  }

  // ローディング状態の表示
  if (isLoadingUserData && !displayUserData) {
    return (
      <div className="min-h-screen bg-theme-page">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-500 mx-auto mb-4"></div>
              <p className="text-neutral-600 font-medium">プロフィール情報を読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // エラー状態の表示
  if (isErrorUserData && !displayUserData) {
    return (
      <div className="min-h-screen bg-theme-page">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-theme-gradient mb-2">
              プロフィール
            </h1>
          </div>
          <Card className="mb-6 border-theme-primary/15 shadow-lg shadow-theme bg-white/80 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-red-500 mb-4 font-medium">
                  プロフィール情報の読み込みに失敗しました
                </p>
                {userDataError && (
                  <p className="text-sm text-neutral-500 mb-4">
                    {userDataError instanceof Error ? userDataError.message : 'エラーが発生しました'}
                  </p>
                )}
                <Button 
                  onClick={() => refetchUserData()}
                  className="text-white shadow-lg shadow-theme hover:opacity-90 transition-all"
                  style={theme.gradientStyle}
                >
                  再試行
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <PageTransition variant="scale">
      <div className="min-h-screen bg-theme-page relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <AnimatedBackground variant="bubbles" />
        
        <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
          {/* ヘッダー */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-theme-gradient mb-1">
              プロフィール
            </h1>
            <p className="text-sm text-neutral-600">
              あなたのプロフィール情報を管理
            </p>
          </motion.div>

        {previewProfile && (
          <div className="mb-8">
            <ProfilePreviewCard profile={previewProfile} />
          </div>
        )}

        {/* プロフィール画像 */}
        <Card className="mb-6 border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-theme-gradient">プロフィール画像</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={getAvatarUrl(displayUserData?.avatar_url, true) || '/initial_icon.png'}
                alt="プロフィール画像"
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  // 画像の読み込みに失敗した場合はデフォルト画像にフォールバック
                  e.currentTarget.src = '/initial_icon.png'
                  setAvatarLoadError(true)
                }}
              />
            </div>
            
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadAvatarMutation.isPending}
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploadAvatarMutation.isPending}
                >
                  {uploadAvatarMutation.isPending ? 'アップロード中...' : '画像を変更'}
                </Button>
              </label>
              <p className="text-sm text-neutral-500 mt-2">
                推奨: 正方形の画像（最大10MB）
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* プロフィール情報 */}
        <Card className="mb-6 border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-theme-gradient">基本情報</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'キャンセル' : '編集'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="表示名"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900">
                  自己紹介
                </label>
                <textarea
                  className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="あなたについて教えてください..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  セクシュアリティ
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // トランスジェンダーを選択している場合、複数選択モードにする
                    const isTransgender = formData.sexuality === 'トランスジェンダー' || 
                      (formData.sexuality ? formData.sexuality.includes('トランスジェンダー') : false)
                    setIsMultipleSexualityMode(isTransgender)
                    if (isTransgender && formData.sexuality) {
                      setSelectedSexualities(formData.sexuality.split(', ').filter(s => s))
                    } else {
                      setSelectedSexualities([])
                    }
                    // 「その他:」で始まる値を抽出
                    if (formData.sexuality?.startsWith('その他:')) {
                      setOtherSexualityText(formData.sexuality.replace('その他: ', ''))
                    } else if (formData.sexuality?.includes(', ') && formData.sexuality.split(', ').some(s => s.startsWith('その他:'))) {
                      const otherItem = formData.sexuality.split(', ').find(s => s.startsWith('その他:'))
                      if (otherItem) {
                        setOtherSexualityText(otherItem.replace('その他: ', ''))
                      }
                    } else {
                      setOtherSexualityText('')
                    }
                    setShowSexualityModal(true)
                  }}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-left hover:bg-neutral-50"
                >
                  {formData.sexuality || '選択してください'}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  探している関係
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // 既に「その他:」で始まる値が設定されている場合、テキストを抽出
                    if (formData.looking_for?.startsWith('その他:')) {
                      setOtherLookingForText(formData.looking_for.replace('その他: ', ''))
                    } else {
                      setOtherLookingForText('')
                    }
                    setShowLookingForModal(true)
                  }}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-left hover:bg-neutral-50"
                >
                  {formData.looking_for || '選択してください'}
                </button>
              </div>
              <Select
                label="キャンパス"
                value={formData.campus}
                onChange={(e) =>
                  setFormData({ ...formData, campus: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: '伊都キャンパス', label: '伊都キャンパス' },
                  { value: '箱崎キャンパス', label: '箱崎キャンパス' },
                  { value: '病院キャンパス', label: '病院キャンパス' },
                  { value: '大橋キャンパス', label: '大橋キャンパス' },
                  { value: 'その他', label: 'その他' },
                ]}
              />
              <Select
                label="学部"
                value={formData.faculty}
                onChange={(e) =>
                  setFormData({ ...formData, faculty: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: '文学部', label: '文学部' },
                  { value: '教育学部', label: '教育学部' },
                  { value: '法学部', label: '法学部' },
                  { value: '経済学部', label: '経済学部' },
                  { value: '理学部', label: '理学部' },
                  { value: '医学部', label: '医学部' },
                  { value: '歯学部', label: '歯学部' },
                  { value: '薬学部', label: '薬学部' },
                  { value: '工学部', label: '工学部' },
                  { value: '芸術工学部', label: '芸術工学部' },
                  { value: '農学部', label: '農学部' },
                  { value: '共創学部', label: '共創学部' },
                ]}
              />
              <Select
                label="学年"
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: '1年生', label: '1年生' },
                  { value: '2年生', label: '2年生' },
                  { value: '3年生', label: '3年生' },
                  { value: '4年生', label: '4年生' },
                  { value: '学部5年', label: '学部5年' },
                  { value: '学部6年', label: '学部6年' },
                  { value: '修士1年', label: '修士1年' },
                  { value: '修士2年', label: '修士2年' },
                  { value: '博士1年', label: '博士1年' },
                  { value: '博士2年', label: '博士2年' },
                  { value: '博士3年', label: '博士3年' },
                ]}
              />
              <Input
                label="生年月日"
                type="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
              />
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  体の性別
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenderModal(true)
                  }}
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-left hover:bg-neutral-50"
                >
                  {formData.gender || '選択してください'}
                </button>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  表示名
                </label>
                <p className="text-neutral-900">
                  {displayUserData?.display_name || '未設定'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  メールアドレス
                </label>
                <p className="text-neutral-900">{displayUserData?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  自己紹介
                </label>
                <p className="text-neutral-900">
                  {displayUserData?.bio || '未設定'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    セクシュアリティ
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.sexuality || '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    探している関係
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.looking_for || '未設定'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  キャンパス
                </label>
                <p className="text-neutral-900">
                  {displayUserData?.campus || '未設定'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    学部
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.faculty || '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    学年
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.grade || '未設定'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    生年月日
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.birthday ? new Date(displayUserData.birthday).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    体の性別
                  </label>
                  <p className="text-neutral-900">
                    {displayUserData?.gender || '未設定'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* プライバシー設定ボタン */}
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <Link href="/privacy-settings">
              <Button variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                プライバシー設定
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

        {/* タグ */}
        <Card className="mb-6 border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-theme-gradient">タグ</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 現在のタグ */}
          <div className="mb-4">
            <label className="text-sm font-medium text-neutral-900 mb-2 block">
              設定中のタグ
            </label>
            {tagsData && tagsData.tags && tagsData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagsData.tags.map((tag: any) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full text-white shadow-md shadow-theme"
                    style={theme.gradientStyle}
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => removeTagMutation.mutate(tag.id)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      disabled={removeTagMutation.isPending}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-600">タグが設定されていません</p>
            )}
          </div>

          {/* タグを追加 */}
          <div>
            <label className="text-sm font-medium text-neutral-900 mb-2 block">
              タグを追加
            </label>
            {allTagsData && allTagsData.tags && allTagsData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTagsData.tags
                  .filter(
                    (tag: any) =>
                      !tagsData?.tags?.some((userTag: any) => userTag.id === tag.id)
                  )
                  .map((tag: any) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTagMutation.mutate(tag.id)}
                      className="px-3 py-1.5 text-sm rounded-full bg-white text-neutral-700 border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      disabled={addTagMutation.isPending}
                    >
                      + {tag.name}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-neutral-600 text-sm">
                利用可能なタグがありません
              </p>
            )}
          </div>
        </CardContent>
      </Card>

        {/* セーフティとテーマ設定 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* セーフティ */}
          <Card className="border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-theme-gradient">セーフティ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Link href="/safety" className="flex-1">
                  <Button variant="outline" className="w-full">
                    🛡️ ブロック・通報管理
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-neutral-600 mt-3">
                ブロックしたユーザーの管理や通報履歴を確認できます
              </p>
            </CardContent>
          </Card>

          {/* テーマ設定 */}
          <Card className="border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-theme-gradient">テーマ設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Link href="/theme-settings" className="flex-1">
                  <Button variant="outline" className="w-full">
                    🎨 テーマカラーを変更
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-neutral-600 mt-3">
                アプリのテーマカラーを選択できます
              </p>
            </CardContent>
          </Card>
        </div>

        {/* アカウント設定 */}
        <Card className="border-theme-primary/20 shadow-2xl shadow-theme bg-white/80 backdrop-blur-md hover:shadow-theme-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-theme-gradient">アカウント設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            ログアウト
          </Button>
        </CardContent>
      </Card>

        {/* セクシュアリティ選択モーダル */}
        {showSexualityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-neutral-900">
              {isMultipleSexualityMode ? 'セクシュアリティを選択（複数可）' : 'セクシュアリティを選択'}
            </h3>
            <div className="space-y-2">
              {[
                'ゲイ', 'レズビアン', 'バイセクシュアル', 'トランスジェンダー', 
                'パンセクシュアル', 'アセクシュアル', 'その他', '回答しない'
              ].map((option) => {
                const isSelected = isMultipleSexualityMode 
                  ? selectedSexualities.includes(option) || selectedSexualities.some(s => s.startsWith('その他'))
                  : formData.sexuality === option || formData.sexuality?.startsWith('その他')
                
                return (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === 'その他') {
                        // 「その他」の場合は入力欄を表示するため、モーダルを開いたままにする
                        if (isMultipleSexualityMode) {
                          if (!selectedSexualities.some(s => s === 'その他' || s.startsWith('その他'))) {
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
                          setIsMultipleSexualityMode(false)
                          setSelectedSexualities([])
                        }
                      }
                    }}
                    className={`w-full p-3 text-left hover:bg-neutral-50 rounded-lg ${
                      isSelected && option !== 'その他' && !formData.sexuality?.startsWith('その他') ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-900'
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
            {(formData.sexuality === 'その他' || selectedSexualities.some(s => s === 'その他' || s.startsWith('その他'))) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  具体的に入力してください
                </label>
                <input
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
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
            )}
            {isMultipleSexualityMode && (
              <div className="mt-4 text-sm text-neutral-600">
                選択中: {selectedSexualities.length > 0 ? selectedSexualities.map(s => s.startsWith('その他') ? 'その他' : s).join(', ') : 'なし'}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {isMultipleSexualityMode && (
                <Button
                  onClick={() => {
                    if (selectedSexualities.some(s => s === 'その他' || s.startsWith('その他')) && !otherSexualityText.trim()) {
                      // 「その他」が選択されているが入力がない場合は確定できない
                      return
                    }
                    setFormData({ ...formData, sexuality: selectedSexualities.join(', ') })
                    setShowSexualityModal(false)
                    setIsMultipleSexualityMode(false)
                    setSelectedSexualities([])
                    setOtherSexualityText('')
                  }}
                  className="flex-1 bg-primary-500 text-white"
                  disabled={selectedSexualities.some(s => s === 'その他' || s.startsWith('その他')) && !otherSexualityText.trim()}
                >
                  確定
                </Button>
              )}
              {(formData.sexuality === 'その他' || selectedSexualities.some(s => s === 'その他' || s.startsWith('その他'))) && !isMultipleSexualityMode && (
                <Button
                  onClick={() => {
                    if (otherSexualityText.trim()) {
                      setShowSexualityModal(false)
                    }
                  }}
                  className="flex-1 bg-primary-500 text-white"
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
                  if ((formData.sexuality === 'その他' || selectedSexualities.some(s => s === 'その他' || s.startsWith('その他'))) && !otherSexualityText.trim()) {
                    setFormData({ ...formData, sexuality: '' })
                  }
                  setOtherSexualityText('')
                }}
                className={`${(formData.sexuality === 'その他' || selectedSexualities.some(s => s === 'その他' || s.startsWith('その他'))) || isMultipleSexualityMode ? 'flex-1' : 'w-full'} bg-neutral-200 text-neutral-900`}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

        {/* 体の性別選択モーダル */}
        {showGenderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-neutral-900">体の性別を選択</h3>
            <div className="space-y-2">
              {genderOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, gender: option })
                    setShowGenderModal(false)
                  }}
                  className={`w-full p-3 text-left hover:bg-neutral-50 rounded-lg ${
                    formData.gender === option
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-neutral-900'
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
                className="w-full bg-neutral-200 text-neutral-900"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

        {/* 探している関係選択モーダル */}
        {showLookingForModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-neutral-900">探している関係を選択</h3>
            <div className="space-y-2">
              {['恋愛関係', '友達', 'カジュアルな関係', '長期的な関係', 'その他'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (option === 'その他') {
                      setFormData({ ...formData, looking_for: 'その他' })
                    } else {
                      setFormData({ ...formData, looking_for: option })
                      setOtherLookingForText('')
                      setShowLookingForModal(false)
                    }
                  }}
                  className={`w-full p-3 text-left hover:bg-neutral-50 rounded-lg ${
                    (formData.looking_for === option || (option === 'その他' && formData.looking_for?.startsWith('その他'))) && option !== 'その他'
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-neutral-900'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {(formData.looking_for === 'その他' || formData.looking_for?.startsWith('その他')) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  具体的に入力してください
                </label>
                <input
                  type="text"
                  value={otherLookingForText}
                  onChange={(e) => {
                    setOtherLookingForText(e.target.value)
                    setFormData({ 
                      ...formData, 
                      looking_for: e.target.value ? `その他: ${e.target.value}` : 'その他'
                    })
                  }}
                  placeholder="例: ビジネスパートナーなど"
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {(formData.looking_for === 'その他' || formData.looking_for?.startsWith('その他')) && (
                <Button
                  onClick={() => {
                    if (otherLookingForText.trim()) {
                      setShowLookingForModal(false)
                    }
                  }}
                  className="flex-1 bg-primary-500 text-white"
                  disabled={!otherLookingForText.trim()}
                >
                  確定
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowLookingForModal(false)
                  if ((formData.looking_for === 'その他' || formData.looking_for?.startsWith('その他')) && !otherLookingForText.trim()) {
                    setFormData({ ...formData, looking_for: '' })
                  }
                }}
                className={`${(formData.looking_for === 'その他' || formData.looking_for?.startsWith('その他')) ? 'flex-1' : 'w-full'} bg-neutral-200 text-neutral-900`}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>
    </PageTransition>
  )
}

