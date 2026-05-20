'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/common/ToastContainer'
import { useUser, useAuthStore } from '@/stores/auth'

interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  rejected_at: string | null
  reason: string | null
}

export default function AgeVerificationPendingPage() {
  const router = useRouter()
  const { toast, toasts, removeToast } = useToast()
  const user = useUser()
  const [pollingInterval, setPollingInterval] = useState(3000) // 初期: 3秒

  // ステータス確認API
  const { data: verification, refetch, isLoading } = useQuery<VerificationStatus | null>({
    queryKey: ['age-verification-status'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/age-verification/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.status === 404) {
        // まだ学生証が未提出の状態
        return null
      }

      if (!response.ok) {
        throw new Error('ステータスの確認に失敗しました')
      }

      return (await response.json()) as VerificationStatus
    },
    refetchInterval: pollingInterval,
    retry: true,
  })

  // ステータス変更時の処理
  useEffect(() => {
    if (verification === null) {
      // 待機ページへ直接来たが、提出データがない場合はアップロード画面へ戻す
      setPollingInterval(0)
      router.replace('/student-id-upload')
      return
    }

    if (!verification) return

    console.log('[AgeVerificationPending] Status check:', verification.status)

    if (verification.status === 'approved') {
      console.log('[AgeVerificationPending] Approved, redirecting to initial-profile')
      toast({
        title: "年齢確認完了",
        description: "プロフィール設定に進みます",
        type: "success"
      })
      // ポーリングを停止
      setPollingInterval(0)
      
      // ユーザー情報（age_verified = true等）を最新化してから遷移する
      // ※ initialize()を呼ぶとグローバルなisLoadingがtrueになり、レイアウト側でこのページがアンマウントされ
      // 再マウント時にまた初期化が走る無限ループになるため、直接フェッチしてローカルのstateだけ更新する
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      const currentUserId = useAuthStore.getState().user?.id
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store' // ブラウザキャッシュをバイパスして確実に最新を取得
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to refresh user')
        return res.json()
      })
      .then(userData => {
        // IDが一致する場合のみ更新（別アカウントのトークンが混在していた場合はスキップ）
        if (currentUserId && userData.id !== currentUserId) {
          console.warn('[AgeVerificationPending] User ID mismatch, skipping update. Expected:', currentUserId, 'Got:', userData.id)
        } else {
          useAuthStore.getState().setUser(userData)
        }
        setTimeout(() => {
          router.push('/initial-profile')
        }, 1500)
      })
      .catch(err => {
        console.error('[AgeVerificationPending] Failed to refresh user', err)
        setTimeout(() => {
          router.push('/initial-profile')
        }, 1500)
      })
    } else if (verification.status === 'rejected') {
      console.log('[AgeVerificationPending] Rejected, reason:', verification.reason)
      toast({
        title: "年齢確認が却下されました",
        description: verification.reason || "学生証が無効です。再度アップロードしてください。",
        type: "error"
      })
      // ポーリングを停止
      setPollingInterval(0)
      setTimeout(() => {
        router.push('/student-id-upload')
      }, 2000)
    }
  }, [verification, toast, router])

  // 手動で再確認ボタン
  const handleManualRefresh = () => {
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center p-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="w-full max-w-md text-center space-y-8">
        {/* アニメーション */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-pink-200 rounded-full animate-pulse" />
            <div className="absolute inset-2 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              ⏳
            </div>
          </div>
        </div>

        {/* メッセージ */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">確認中です</h1>
          <p className="text-neutral-600">
            担当者が学生証を確認しています。
            <br />
            しばらくお待ちください。
          </p>
        </div>

        {/* ステータス表示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-blue-900">📋 確認ステータス</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">学生証アップロード完了</p>
                <p className="text-xs text-blue-700">{verification?.created_at ? new Date(verification.created_at).toLocaleString('ja-JP') : '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                verification?.status === 'approved'
                  ? 'bg-green-100'
                  : verification?.status === 'rejected'
                  ? 'bg-red-100'
                  : 'bg-neutral-100 animate-pulse'
              }`}>
                {verification?.status === 'approved' ? (
                  <span className="text-green-600 font-semibold">✓</span>
                ) : verification?.status === 'rejected' ? (
                  <span className="text-red-600 font-semibold">✗</span>
                ) : (
                  <span className="text-neutral-400">...</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {verification?.status === 'approved'
                    ? '年齢確認済み'
                    : verification?.status === 'rejected'
                    ? '却下'
                    : '確認中'}
                </p>
                {verification?.status === 'approved' && verification?.rejected_at && (
                  <p className="text-xs text-blue-700">{new Date(verification.rejected_at).toLocaleString('ja-JP')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 情報 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-green-900 mb-2">💡 よくあるご質問</h3>
          <div className="space-y-2 text-sm text-green-800">
            <p><strong>Q: どのくらい時間がかかりますか？</strong></p>
            <p className="text-green-700 ml-2">通常、営業時間内であれば数時間以内に確認が完了します。</p>
            <p className="mt-3"><strong>Q: 却下されたらどうなりますか？</strong></p>
            <p className="text-green-700 ml-2">別の学生証で再度アップロードしていただけます。</p>
          </div>
        </div>

        {/* ボタン */}
        <div className="space-y-3">
          <Button
            onClick={handleManualRefresh}
            variant="secondary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                確認中...
              </div>
            ) : (
              '🔄 ステータスを確認する'
            )}
          </Button>

          <Button
            onClick={() => router.push('/student-id-upload')}
            variant="secondary"
            className="w-full text-neutral-600"
          >
            別の学生証をアップロードする
          </Button>
        </div>

        {/* サポート */}
        <div className="text-xs text-neutral-500 space-y-1">
          <p>問題が発生している場合は、サポートにお問い合わせください。</p>
          <a href="mailto:support@qupid.example.com" className="text-pink-600 hover:underline">
            support@qupid.example.com
          </a>
        </div>
      </div>
    </div>
  )
}
