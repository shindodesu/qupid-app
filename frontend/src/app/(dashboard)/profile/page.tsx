'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUser, useAuthStore } from '@/stores/auth'
import { getAvatarUrl } from '@/lib/utils/image'

export default function ProfilePage() {
  const router = useRouter()
  const user = useUser()
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [avatarLoadError, setAvatarLoadError] = useState(false)
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

  // 自分の情報取得（キャッシュを無効化して常に最新データを取得）
  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 0, // 常にstaleとして扱う
    gcTime: 0, // キャッシュを保持しない（React Query v5）
    refetchOnMount: 'always', // マウント時は常に再取得
    refetchOnWindowFocus: true, // ウィンドウフォーカス時にも再取得
  })

  // ページマウント時にクエリキャッシュを無効化
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
  }, [queryClient])

  // userDataが取得されたら、formDataを初期化
  useEffect(() => {
    if (userData) {
      setFormData({
        display_name: userData.display_name || '',
        bio: userData.bio || '',
        campus: userData.campus || '',
        faculty: userData.faculty || '',
        grade: userData.grade || '',
        birthday: userData.birthday || '',
        gender: userData.gender || '',
        sexuality: userData.sexuality || '',
        looking_for: userData.looking_for || '',
      })
      // アバターURLが変わったらエラー状態をリセット
      setAvatarLoadError(false)
    }
  }, [userData])

  // 自分のタグ取得
  const { data: tagsData } = useQuery({
    queryKey: ['user', 'me', 'tags'],
    queryFn: () => apiClient.getUserTags(),
  })

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          プロフィール
        </h1>
        <p className="text-neutral-600">
          あなたのプロフィール情報を管理
        </p>
      </div>

      {/* プロフィール画像 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>プロフィール画像</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {userData?.avatar_url && !avatarLoadError ? (
                <img
                  src={getAvatarUrl(userData.avatar_url) || ''}
                  alt="プロフィール画像"
                  className="w-24 h-24 rounded-full object-cover"
                  onError={() => {
                    // 画像の読み込みに失敗した場合はエラー状態を設定
                    setAvatarLoadError(true)
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neutral-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
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
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>基本情報</CardTitle>
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
              <Select
                label="セクシュアリティ"
                value={formData.sexuality}
                onChange={(e) =>
                  setFormData({ ...formData, sexuality: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: 'ストレート', label: 'ストレート' },
                  { value: 'ゲイ', label: 'ゲイ' },
                  { value: 'レズビアン', label: 'レズビアン' },
                  { value: 'バイセクシュアル', label: 'バイセクシュアル' },
                  { value: 'パンセクシュアル', label: 'パンセクシュアル' },
                  { value: 'アセクシュアル', label: 'アセクシュアル' },
                  { value: 'その他', label: 'その他' },
                  { value: '回答しない', label: '回答しない' },
                ]}
              />
              <Select
                label="探している関係"
                value={formData.looking_for}
                onChange={(e) =>
                  setFormData({ ...formData, looking_for: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: '恋愛関係', label: '恋愛関係' },
                  { value: '友達', label: '友達' },
                  { value: 'カジュアルな関係', label: 'カジュアルな関係' },
                  { value: '長期的な関係', label: '長期的な関係' },
                  { value: 'その他', label: 'その他' },
                ]}
              />
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
              <Select
                label="性別"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                options={[
                  { value: '', label: '選択してください' },
                  { value: '男性', label: '男性' },
                  { value: '女性', label: '女性' },
                  { value: 'ノンバイナリー', label: 'ノンバイナリー' },
                  { value: 'その他', label: 'その他' },
                  { value: '回答しない', label: '回答しない' },
                ]}
              />
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
                  {userData?.display_name || '未設定'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  メールアドレス
                </label>
                <p className="text-neutral-900">{userData?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  自己紹介
                </label>
                <p className="text-neutral-900">
                  {userData?.bio || '未設定'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    セクシュアリティ
                  </label>
                  <p className="text-neutral-900">
                    {userData?.sexuality || '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    探している関係
                  </label>
                  <p className="text-neutral-900">
                    {userData?.looking_for || '未設定'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">
                  キャンパス
                </label>
                <p className="text-neutral-900">
                  {userData?.campus || '未設定'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    学部
                  </label>
                  <p className="text-neutral-900">
                    {userData?.faculty || '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    学年
                  </label>
                  <p className="text-neutral-900">
                    {userData?.grade || '未設定'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    生年月日
                  </label>
                  <p className="text-neutral-900">
                    {userData?.birthday ? new Date(userData.birthday).toLocaleDateString('ja-JP') : '未設定'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">
                    性別
                  </label>
                  <p className="text-neutral-900">
                    {userData?.gender || '未設定'}
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>タグ</CardTitle>
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full bg-primary-500 text-white"
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

      {/* セーフティ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>セーフティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
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

      {/* アカウント設定 */}
      <Card>
        <CardHeader>
          <CardTitle>アカウント設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            ログアウト
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

