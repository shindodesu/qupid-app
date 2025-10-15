'use client'

import { UserCard } from './UserCard'
import type { UserSearchResult } from '@/types/search'

interface UserListProps {
  users: UserSearchResult[]
  onLike: (userId: number) => Promise<void>
  onUnlike: (userId: number) => Promise<void>
  isLoading?: boolean
}

export function UserList({ users, onLike, onUnlike, isLoading }: UserListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z"
            />
          </svg>
          <p className="mt-4 text-neutral-600">ユーザーが見つかりませんでした</p>
          <p className="mt-2 text-sm text-neutral-500">
            検索条件を変更してみてください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onLike={onLike}
          onUnlike={onUnlike}
        />
      ))}
    </div>
  )
}

