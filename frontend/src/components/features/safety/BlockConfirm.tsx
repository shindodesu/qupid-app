'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { safetyApi } from '@/lib/api/safety'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface BlockConfirmProps {
  isOpen: boolean
  onClose: () => void
  targetUserId: number
  targetUserName: string
  onSuccess?: () => void
}

export function BlockConfirm({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  onSuccess,
}: BlockConfirmProps) {
  const queryClient = useQueryClient()

  const blockMutation = useMutation({
    mutationFn: () => safetyApi.blockUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      alert(`${targetUserName} さんをブロックしました`)
      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      alert(error.message || 'ブロックに失敗しました')
    },
  })

  const handleBlock = () => {
    blockMutation.mutate()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          ユーザーをブロック
        </h2>

        <div className="mb-6">
          <p className="text-neutral-700 mb-4">
            <strong>{targetUserName}</strong> さんをブロックしますか？
          </p>

          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">
              ブロックすると：
            </h3>
            <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
              <li>お互いのプロフィールが表示されなくなります</li>
              <li>メッセージの送受信ができなくなります</li>
              <li>いいねの送信ができなくなります</li>
              <li>検索結果に表示されなくなります</li>
            </ul>
          </div>

          <p className="text-sm text-neutral-600 mt-4">
            ブロックは後から解除できます。
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={blockMutation.isPending}
            className="flex-1"
          >
            {blockMutation.isPending ? 'ブロック中...' : 'ブロックする'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={blockMutation.isPending}
            className="flex-1"
          >
            キャンセル
          </Button>
        </div>
      </div>
    </Modal>
  )
}

