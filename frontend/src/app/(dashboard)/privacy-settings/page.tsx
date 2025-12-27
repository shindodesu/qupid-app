'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import type { User } from '@/types/user'

interface PrivacySettings {
  show_faculty: boolean
  show_grade: boolean
  show_birthday: boolean
  show_age: boolean
  show_gender: boolean
  show_sexuality: boolean
  show_looking_for: boolean
  show_bio: boolean
  show_tags: boolean
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const queryClient = useQueryClient()
  
  const [settings, setSettings] = useState<PrivacySettings>({
    show_faculty: true,
    show_grade: true,
    show_birthday: false,
    show_age: true,
    show_gender: true,
    show_sexuality: true,
    show_looking_for: true,
    show_bio: true,
    show_tags: true,
  })

  // ユーザー情報を取得
  const { data: userData } = useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: () => apiClient.get<User>('/users/me')
  })

  // ユーザー情報からプライバシー設定を読み込む
  useEffect(() => {
    if (userData) {
      setSettings({
        show_faculty: userData.show_faculty ?? true,
        show_grade: userData.show_grade ?? true,
        show_birthday: userData.show_birthday ?? false,
        show_age: userData.show_age ?? true,
        show_gender: userData.show_gender ?? true,
        show_sexuality: userData.show_sexuality ?? true,
        show_looking_for: userData.show_looking_for ?? true,
        show_bio: userData.show_bio ?? true,
        show_tags: userData.show_tags ?? true,
      })
    }
  }, [userData])

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: PrivacySettings) => {
      return apiClient.put('/users/me/privacy', newSettings)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      toast({
        title: "プライバシー設定を更新しました",
        description: "設定が保存されました",
        type: "success"
      })
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "設定の更新に失敗しました",
        type: "error"
      })
    }
  })

  const handleToggle = (field: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSave = () => {
    updateSettingsMutation.mutate(settings)
  }

  const privacyItems = [
    { key: 'show_bio' as keyof PrivacySettings, label: '自己紹介', description: 'あなたの自己紹介文を表示します' },
    { key: 'show_sexuality' as keyof PrivacySettings, label: 'セクシュアリティ', description: 'あなたのセクシュアリティを表示します' },
    { key: 'show_looking_for' as keyof PrivacySettings, label: '探している関係', description: 'あなたが探している関係を表示します' },
    { key: 'show_faculty' as keyof PrivacySettings, label: '学部', description: 'あなたの所属学部を表示します' },
    { key: 'show_grade' as keyof PrivacySettings, label: '学年', description: 'あなたの学年を表示します' },
    { key: 'show_birthday' as keyof PrivacySettings, label: '生年月日', description: '生年月日を表示します（通常は非公開推奨）' },
    { key: 'show_gender' as keyof PrivacySettings, label: '体の性別', description: 'あなたの体の性別を表示します' },
    { key: 'show_age' as keyof PrivacySettings, label: '年齢', description: 'あなたの年齢を表示します' },
    { key: 'show_tags' as keyof PrivacySettings, label: 'タグ', description: 'あなたの興味・関心タグを表示します' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-neutral-900">プライバシー設定</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              プロフィール情報の公開設定
            </h2>
            <p className="text-sm text-neutral-600">
              他のユーザーに表示する情報を選択できます。非公開にした項目は検索結果にも表示されません。
            </p>
          </div>

          <div className="divide-y divide-neutral-200">
            {privacyItems.map((item) => (
              <div key={item.key} className="p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-neutral-900">{item.label}</h3>
                    <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      settings[item.key] ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-neutral-50 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-neutral-600">
                プライバシー設定は、検索結果やプロフィール表示に即座に反映されます。
              </p>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              {updateSettingsMutation.isPending ? '保存中...' : '設定を保存'}
            </Button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-900 mb-1">注意事項</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 非公開にした情報は、他のユーザーのプロフィール閲覧時や検索結果に表示されません</li>
                <li>• 一部の情報（体の性別、セクシュアリティなど）は、マッチングの精度向上のため公開を推奨します</li>
                <li>• メールアドレスは常に非公開です</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
