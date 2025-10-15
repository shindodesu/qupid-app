'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { safetyApi } from '@/lib/api/safety'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { Report, Block } from '@/types/safety'

type TabType = 'reports' | 'blocks'

export function SafetyList() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('blocks')

  // ブロック一覧取得
  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['blocks', 'my'],
    queryFn: () => safetyApi.getMyBlocks(50, 0),
  })

  // 通報一覧取得
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'my'],
    queryFn: () => safetyApi.getMyReports(50, 0),
  })

  // ブロック解除
  const unblockMutation = useMutation({
    mutationFn: (userId: number) => safetyApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      alert('ブロックを解除しました')
    },
    onError: (error: any) => {
      alert(error.message || 'ブロックの解除に失敗しました')
    },
  })

  const handleUnblock = (block: Block) => {
    if (
      confirm(
        `${block.blocked_user.display_name} さんのブロックを解除しますか？`
      )
    ) {
      unblockMutation.mutate(block.blocked_user.id)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default">対応待ち</Badge>
      case 'reviewing':
        return <Badge variant="secondary">審査中</Badge>
      case 'resolved':
        return <Badge variant="success">解決済み</Badge>
      case 'rejected':
        return <Badge variant="outline">却下</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'blocks'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          ブロック一覧
          {blocksData && blocksData.blocks.length > 0 && (
            <span className="ml-2 text-sm">({blocksData.blocks.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'reports'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          通報履歴
          {reportsData && reportsData.reports.length > 0 && (
            <span className="ml-2 text-sm">({reportsData.reports.length})</span>
          )}
        </button>
      </div>

      {/* ブロック一覧 */}
      {activeTab === 'blocks' && (
        <div>
          {blocksLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-neutral-600">読み込み中...</p>
            </div>
          ) : blocksData && blocksData.blocks.length > 0 ? (
            <div className="space-y-4">
              {blocksData.blocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {block.blocked_user.display_name}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          ブロック日時:{' '}
                          {new Date(block.created_at).toLocaleDateString(
                            'ja-JP',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(block)}
                        disabled={unblockMutation.isPending}
                      >
                        ブロック解除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛡️</div>
              <p className="text-neutral-600">ブロックしているユーザーはいません</p>
            </div>
          )}
        </div>
      )}

      {/* 通報履歴 */}
      {activeTab === 'reports' && (
        <div>
          {reportsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-neutral-600">読み込み中...</p>
            </div>
          ) : reportsData && reportsData.reports.length > 0 ? (
            <div className="space-y-4">
              {reportsData.reports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {report.target_user?.display_name || '削除されたユーザー'}
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          通報日時:{' '}
                          {new Date(report.created_at).toLocaleDateString(
                            'ja-JP',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="mt-3 p-3 bg-neutral-50 rounded-md">
                      <p className="text-sm text-neutral-700 font-medium mb-1">
                        通報理由:
                      </p>
                      <p className="text-sm text-neutral-600">{report.reason}</p>
                    </div>
                    {report.admin_note && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-900 font-medium mb-1">
                          運営からの返信:
                        </p>
                        <p className="text-sm text-blue-800">{report.admin_note}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-neutral-600">通報履歴はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

