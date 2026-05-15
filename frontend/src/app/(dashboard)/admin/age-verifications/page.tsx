'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useUser } from '@/stores/auth'
import { useState } from 'react'

interface PendingVerification {
  id: number
  user_id: number
  email: string
  image_url: string
  created_at: string
}

export default function AgeVerificationsPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)

  // 管理者チェック
  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">アクセス権限がありません</h1>
          <p className="text-neutral-600 mt-2">管理者のみアクセス可能です</p>
          <Button onClick={() => router.push('/home')} className="mt-4">
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  // 未確認一覧取得
  const { data: verifications, isLoading, refetch } = useQuery({
    queryKey: ['pending-verifications', limit, offset],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/admin/pending?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('未確認一覧の取得に失敗しました')
      }

      return (await response.json()) as PendingVerification[]
    },
  })

  return (
    <div className="min-h-screen bg-neutral-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-6xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">年齢確認管理</h1>
            <p className="text-neutral-600 mt-1">未確認の学生証一覧</p>
          </div>
          <Button onClick={() => refetch()}>🔄 更新</Button>
        </div>

        {/* 一覧 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" />
              <p className="text-neutral-600 mt-2">読み込み中...</p>
            </div>
          </div>
        ) : !verifications || verifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
            <p className="text-neutral-600 text-lg">確認待機中の学生証はありません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">メールアドレス</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-700">アップロード日時</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-neutral-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {verifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-neutral-50 transition">
                      <td className="px-6 py-4 text-sm text-neutral-900">#{verification.id}</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">{verification.email}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {new Date(verification.created_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => router.push(`/admin/age-verifications/${verification.id}`)}
                          size="sm"
                          variant="primary"
                        >
                          確認する
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-neutral-600">
                表示: {Math.min(offset + 1, verifications.length)} - {Math.min(offset + limit, verifications.length + offset)}
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  variant="secondary"
                  size="sm"
                >
                  ← 前へ
                </Button>
                <Button
                  onClick={() => setOffset(offset + limit)}
                  disabled={!verifications || verifications.length < limit}
                  variant="secondary"
                  size="sm"
                >
                  次へ →
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
