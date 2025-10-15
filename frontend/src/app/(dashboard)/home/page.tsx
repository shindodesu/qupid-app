'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { searchApi } from '@/lib/api/search'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useUser } from '@/stores/auth'

export default function HomePage() {
  const user = useUser()

  // おすすめユーザー取得
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => searchApi.getSuggestions(6),
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ウェルカムセクション */}
      <div className="mb-8">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">
        ようこそ、{user?.display_name || 'ゲスト'}さん！
      </h1>
        <p className="text-neutral-600">
          気になる人を探して、いいねを送ってみましょう
        </p>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/search">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold mb-2">ユーザーを探す</h3>
              <p className="text-sm text-neutral-600">
                タグや条件で絞り込んで検索
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/matches">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="text-4xl mb-3">💕</div>
              <h3 className="text-lg font-semibold mb-2">マッチを見る</h3>
              <p className="text-sm text-neutral-600">
                マッチした人とチャット
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-lg font-semibold mb-2">プロフィール</h3>
              <p className="text-sm text-neutral-600">
                プロフィールを編集
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* おすすめユーザー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>おすすめのユーザー</CardTitle>
            <Link href="/search">
              <Button variant="outline" size="sm">
                もっと見る
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <p className="mt-4 text-neutral-600">読み込み中...</p>
              </div>
            </div>
          ) : suggestionsData && suggestionsData.users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestionsData.users.map((user) => (
                <Link key={user.id} href={`/search?user=${user.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{user.display_name}</h3>
                      {(user.faculty || user.grade) && (
                        <p className="text-sm text-neutral-600 mb-2">
                          {[user.faculty, user.grade].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {user.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {user.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" size="sm">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span>マッチ度: {Math.round(user.match_score * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-600">
              <p>おすすめのユーザーがありません</p>
              <p className="text-sm mt-2">
                プロフィールにタグを追加すると、おすすめが表示されます
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

