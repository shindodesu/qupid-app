import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-4">
              ページが見つかりません
            </h2>
            <p className="text-neutral-600 mb-6">
              お探しのページは存在しないか、移動した可能性があります。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/home" className="flex-1">
                <Button className="w-full">
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

