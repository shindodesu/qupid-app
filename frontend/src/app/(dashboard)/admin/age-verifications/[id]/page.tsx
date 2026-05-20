'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useUser } from '@/stores/auth'
import { useState } from 'react'

interface VerificationDetail {
  id: number
  user_id: number
  email: string
  image_url: string
  verification_code: string | null
  status: string
  created_at: string
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
}

export default function VerificationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  const verificationId = params.id as string

  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  // 管理者チェック
  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">アクセス権限がありません</h1>
          <Button onClick={() => router.push('/home')} className="mt-4">
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  // 詳細情報取得
  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification-detail', verificationId],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/admin/${verificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('詳細情報の取得に失敗しました')
      }

      return (await response.json()) as VerificationDetail
    },
  })

  // 承認処理
  const approveMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/admin/${verificationId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memo: null }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '承認処理に失敗しました')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "承認完了",
        description: "年齢確認を承認しました。ユーザーにメールが送信されます。",
        type: "success"
      })
      setTimeout(() => router.push('/admin/age-verifications'), 1500)
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        type: "error"
      })
    }
  })

  // 却下処理
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectionReason.trim()) {
        throw new Error('却下理由を入力してください')
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/admin/${verificationId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '却下処理に失敗しました')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "却下完了",
        description: "年齢確認を却下しました。ユーザーに連絡されます。",
        type: "success"
      })
      setTimeout(() => router.push('/admin/age-verifications'), 1500)
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        type: "error"
      })
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-neutral-600 mt-2">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!verification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">データが見つかりません</h1>
          <Button onClick={() => router.push('/admin/age-verifications')} className="mt-4">
            一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="max-w-4xl mx-auto p-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/admin/age-verifications')}
            variant="secondary"
            className="mb-4"
          >
            ← 一覧に戻る
          </Button>
          <h1 className="text-3xl font-bold text-neutral-900">年齢確認詳細</h1>
        </div>

        {/* メイン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 学生証画像 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="bg-neutral-900 aspect-video flex items-center justify-center">
                {verification.image_url ? (
                  <img
                    src={verification.image_url.startsWith('http') ? verification.image_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${verification.image_url}`}
                    alt="Student ID"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-neutral-400">画像はありません</p>
                )}
              </div>
            </div>
          </div>

          {/* 情報パネル */}
          <div className="space-y-4">
            {/* 認証コード表示 (重要) */}
            <div className="bg-pink-50 rounded-lg border-2 border-pink-200 p-4 shadow-sm">
              <h3 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                <span className="text-xl">📝</span> 手描き認証コード
              </h3>
              <div className="text-center py-4 bg-white rounded border border-pink-100">
                {verification.verification_code ? (
                  <p className="text-5xl font-black tracking-widest text-pink-600">
                    {verification.verification_code}
                  </p>
                ) : (
                  <p className="text-neutral-400 italic text-sm">コード未記録</p>
                )}
              </div>
              <p className="text-[10px] text-pink-700 mt-2 text-center">
                ※写真内にこの数字が手書きされているか確認してください
              </p>
            </div>

            {/* ユーザー情報 */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">ユーザー情報</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-neutral-600">ID</p>
                  <p className="font-mono text-neutral-900">{verification.user_id}</p>
                </div>
                <div>
                  <p className="text-neutral-600">メール</p>
                  <p className="text-neutral-900 break-all">{verification.email}</p>
                </div>
              </div>
            </div>

            {/* ステータス */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">ステータス</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-neutral-600">状態</p>
                  <p className={`font-semibold ${
                    verification.status === 'approved' ? 'text-green-600' :
                    verification.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {verification.status === 'approved' ? '✓ 承認済み' :
                     verification.status === 'rejected' ? '✗ 却下' :
                     '⏳ 確認中'}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-600">アップロード日時</p>
                  <p className="text-neutral-900">
                    {new Date(verification.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                {verification.rejection_reason && (
                  <div>
                    <p className="text-neutral-600">却下理由</p>
                    <p className="text-red-600">{verification.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 操作パネル */}
        {verification.status === 'pending' && (
          <div className="mt-8 bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">確認結果</h2>

            {!showRejectForm ? (
              <div className="space-y-4">
                <p className="text-neutral-600">
                  学生証の確認が完了しましたか？
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    variant="primary"
                    className="flex-1"
                  >
                    {approveMutation.isPending ? '処理中...' : '✓ 承認する'}
                  </Button>
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    disabled={rejectMutation.isPending}
                    variant="secondary"
                    className="flex-1 text-red-600"
                  >
                    ✗ 却下する
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    却下理由 <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="学生証が不鮮明です など"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    この理由はユーザーに送信されるメールに記載されます
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    variant="primary"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {rejectMutation.isPending ? '処理中...' : '✗ 却下を確定する'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionReason('')
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
