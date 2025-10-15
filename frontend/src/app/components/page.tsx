'use client'

import { useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Avatar, Badge, Loading, Modal, Select } from '@/components/ui'

export default function ComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectOptions = [
    { value: 'option1', label: 'オプション1' },
    { value: 'option2', label: 'オプション2' },
    { value: 'option3', label: 'オプション3' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold text-neutral-900">UIコンポーネント一覧</h1>
        
        {/* Button */}
        <Card>
          <CardHeader>
            <CardTitle>Button</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>デフォルト</Button>
              <Button variant="secondary">セカンダリ</Button>
              <Button variant="outline">アウトライン</Button>
              <Button variant="ghost">ゴースト</Button>
              <Button variant="link">リンク</Button>
              <Button variant="destructive">削除</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">小</Button>
              <Button size="default">中</Button>
              <Button size="lg">大</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="ラベル付き入力" 
              placeholder="プレースホルダー" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input 
              label="エラー状態" 
              error="エラーメッセージ" 
              defaultValue="エラー値"
            />
            <Input 
              label="ヘルパーテキスト" 
              helperText="ヘルパーテキストです" 
              placeholder="入力してください"
            />
          </CardContent>
        </Card>

        {/* Select */}
        <Card>
          <CardHeader>
            <CardTitle>Select</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              label="選択肢" 
              options={selectOptions}
              placeholder="選択してください"
            />
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar size="sm" fallback="A" />
              <Avatar size="md" fallback="B" />
              <Avatar size="lg" fallback="C" />
              <Avatar size="xl" fallback="D" />
            </div>
          </CardContent>
        </Card>

        {/* Badge */}
        <Card>
          <CardHeader>
            <CardTitle>Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge>デフォルト</Badge>
              <Badge variant="secondary">セカンダリ</Badge>
              <Badge variant="outline">アウトライン</Badge>
              <Badge variant="success">成功</Badge>
              <Badge variant="warning">警告</Badge>
              <Badge variant="destructive">エラー</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <Loading size="sm" />
                <p className="mt-2 text-sm text-neutral-500">小</p>
              </div>
              <div className="text-center">
                <Loading size="md" />
                <p className="mt-2 text-sm text-neutral-500">中</p>
              </div>
              <div className="text-center">
                <Loading size="lg" />
                <p className="mt-2 text-sm text-neutral-500">大</p>
              </div>
              <div className="text-center">
                <Loading variant="dots" />
                <p className="mt-2 text-sm text-neutral-500">ドット</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>
              モーダルを開く
            </Button>
          </CardContent>
        </Card>

        {/* Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="サンプルモーダル"
        >
          <p className="text-neutral-600">
            これはサンプルのモーダルです。右上の×ボタンまたは背景をクリックして閉じることができます。
          </p>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              確認
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  )
}
