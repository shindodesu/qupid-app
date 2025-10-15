'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUser, useAuthStore } from '@/stores/auth'

export default function ProfilePage() {
  const user = useUser()
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    display_name: user?.displayName || '',
    bio: user?.bio || '',
    faculty: '',
    grade: '',
  })

  // 自分の情報取得
  const { data: userData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.getCurrentUser(),
  })

  // 自分のタグ取得
  const { data: tagsData } = useQuery({
    queryKey: ['user', 'me', 'tags'],
    queryFn: () => apiClient.getUserTags(),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleLogout = () => {
    useAuthStore.getState().logout()
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
              <Input
                label="学部"
                value={formData.faculty}
                onChange={(e) =>
                  setFormData({ ...formData, faculty: e.target.value })
                }
              />
              <Input
                label="学年"
                value={formData.grade}
                onChange={(e) =>
                  setFormData({ ...formData, grade: e.target.value })
                }
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* タグ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>タグ</CardTitle>
        </CardHeader>
        <CardContent>
          {tagsData && tagsData.tags && tagsData.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tagsData.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600">タグが設定されていません</p>
          )}
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
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            ログアウト
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

