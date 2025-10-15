'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { safetyApi } from '@/lib/api/safety'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUserId: number
  targetUserName: string
}

const REPORT_REASONS = [
  '不適切なメッセージ',
  'ハラスメント',
  'スパム・宣伝',
  '偽のプロフィール',
  'その他',
]

export function ReportDialog({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
}: ReportDialogProps) {
  const queryClient = useQueryClient()
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reportMutation = useMutation({
    mutationFn: (reason: string) => safetyApi.reportUser(targetUserId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'my'] })
      alert('通報を送信しました。運営チームが確認いたします。')
      handleClose()
    },
    onError: (error: any) => {
      setError(error.message || '通報の送信に失敗しました')
    },
  })

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    setError(null)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const reason =
      selectedReason === 'その他'
        ? customReason.trim()
        : selectedReason

    if (!reason) {
      setError('通報理由を選択または入力してください')
      return
    }

    if (reason.length > 1000) {
      setError('通報理由は1000文字以内で入力してください')
      return
    }

    reportMutation.mutate(reason)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          ユーザーを通報
        </h2>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-neutral-700">
            <strong>{targetUserName}</strong> さんを通報します。
          </p>
          <p className="text-xs text-neutral-600 mt-2">
            通報内容は運営チームが確認し、適切に対応いたします。
            虚偽の通報は禁止されています。
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              通報理由を選択してください
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'その他' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                詳細を入力してください
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="通報理由を具体的に記入してください"
                className="w-full h-32 p-3 border border-neutral-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={1000}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {customReason.length} / 1000 文字
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              variant="destructive"
              disabled={reportMutation.isPending}
              className="flex-1"
            >
              {reportMutation.isPending ? '送信中...' : '通報する'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={reportMutation.isPending}
              className="flex-1"
            >
              キャンセル
            </Button>
          </div>

          <p className="text-xs text-neutral-500 mt-4 text-center">
            <a
              href="/guidelines"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              コミュニティガイドライン
            </a>
            を確認する
          </p>
        </form>
      </div>
    </Modal>
  )
}

