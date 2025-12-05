'use client'

import { useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Avatar, Badge, Loading, Modal, Select } from '@/components/ui'
import { Typography, Heading, Subheading, Paragraph, Lead, Large, Small, Muted, Blockquote, List, InlineCode } from '@/components/ui/Typography'
import { Spacing, Spacer, Divider, Container, Stack, Grid } from '@/components/ui/Spacing'
import { tokens, semanticColors } from '@/lib/design-tokens'

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background-secondary">
      <Container className="py-8">
        <Stack size={8}>
          {/* ヘッダー */}
          <div className="text-center">
            <Heading className="mb-4">Qupid Design System</Heading>
            <Lead className="max-w-2xl mx-auto">
              一貫したデザインとユーザーエクスペリエンスを提供するための包括的なデザインシステム
            </Lead>
          </div>

          {/* カラーパレット */}
          <Card>
            <CardHeader>
              <CardTitle>カラーパレット</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack size={6}>
                {/* Primary Colors */}
                <div>
                  <Subheading className="mb-4">Primary Colors</Subheading>
                  <Grid cols={5} gap={4}>
                    {Object.entries(tokens.colors.primary).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg mb-2 border"
                          style={{ backgroundColor: value }}
                        />
                        <Small className="font-mono">{key}</Small>
                        <Muted className="font-mono text-xs">{value}</Muted>
                      </div>
                    ))}
                  </Grid>
                </div>

                {/* Secondary Colors */}
                <div>
                  <Subheading className="mb-4">Secondary Colors</Subheading>
                  <Grid cols={5} gap={4}>
                    {Object.entries(tokens.colors.secondary).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg mb-2 border"
                          style={{ backgroundColor: value }}
                        />
                        <Small className="font-mono">{key}</Small>
                        <Muted className="font-mono text-xs">{value}</Muted>
                      </div>
                    ))}
                  </Grid>
                </div>

                {/* Neutral Colors */}
                <div>
                  <Subheading className="mb-4">Neutral Colors</Subheading>
                  <Grid cols={5} gap={4}>
                    {Object.entries(tokens.colors.neutral).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-full h-16 rounded-lg mb-2 border"
                          style={{ backgroundColor: value }}
                        />
                        <Small className="font-mono">{key}</Small>
                        <Muted className="font-mono text-xs">{value}</Muted>
                      </div>
                    ))}
                  </Grid>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* タイポグラフィ */}
          <Card>
            <CardHeader>
              <CardTitle>タイポグラフィ</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack size={6}>
                <div>
                  <Heading>Heading 1</Heading>
                  <Muted>text-4xl font-extrabold tracking-tight lg:text-5xl</Muted>
                </div>
                <div>
                  <Subheading>Heading 2</Subheading>
                  <Muted>text-3xl font-semibold tracking-tight</Muted>
                </div>
                <div>
                  <Typography variant="h3">Heading 3</Typography>
                  <Muted>text-2xl font-semibold tracking-tight</Muted>
                </div>
                <div>
                  <Typography variant="h4">Heading 4</Typography>
                  <Muted>text-xl font-semibold tracking-tight</Muted>
                </div>
                <div>
                  <Typography variant="h5">Heading 5</Typography>
                  <Muted>text-lg font-semibold tracking-tight</Muted>
                </div>
                <div>
                  <Typography variant="h6">Heading 6</Typography>
                  <Muted>text-base font-semibold tracking-tight</Muted>
                </div>
                <div>
                  <Paragraph>
                    これは通常の段落テキストです。読みやすさを重視した行間とフォントサイズを使用しています。
                  </Paragraph>
                  <Muted>text-base leading-7</Muted>
                </div>
                <div>
                  <Lead>
                    これはリードテキストです。重要な情報や概要を伝えるために使用されます。
                  </Lead>
                  <Muted>text-xl text-text-secondary</Muted>
                </div>
                <div>
                  <Large>Large Text</Large>
                  <Muted>text-lg font-semibold</Muted>
                </div>
                <div>
                  <Small>Small Text</Small>
                  <Muted>text-sm font-medium leading-none</Muted>
                </div>
                <div>
                  <Muted>Muted Text</Muted>
                  <Muted>text-sm text-text-tertiary</Muted>
                </div>
                <div>
                  <Blockquote>
                    "デザインは見た目だけではありません。デザインはどのように機能するかです。"
                  </Blockquote>
                  <Muted>border-l-2 border-border-primary pl-6 italic</Muted>
                </div>
                <div>
                  <List>
                    <li>リストアイテム 1</li>
                    <li>リストアイテム 2</li>
                    <li>リストアイテム 3</li>
                  </List>
                  <Muted>my-6 ml-6 list-disc [&gt;li]:mt-2</Muted>
                </div>
                <div>
                  <Paragraph>
                    インラインコード: <InlineCode>const example = "Hello World"</InlineCode>
                  </Paragraph>
                  <Muted>relative rounded bg-neutral-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold</Muted>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* スペーシング */}
          <Card>
            <CardHeader>
              <CardTitle>スペーシング</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack size={6}>
                <div>
                  <Subheading className="mb-4">Spacing Scale</Subheading>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map((size) => (
                      <div key={size} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-mono">{size * 4}px</div>
                        <div 
                          className="bg-primary-500 h-4 rounded"
                          style={{ width: `${size * 4}px` }}
                        />
                        <div className="text-sm text-text-tertiary">spacing-{size}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Subheading className="mb-4">Stack Component</Subheading>
                  <div className="border-2 border-dashed border-border-primary p-4">
                    <Stack size={4} direction="vertical" className="bg-neutral-50 p-4 rounded">
                      <div className="bg-primary-100 p-2 rounded text-center">Item 1</div>
                      <div className="bg-primary-100 p-2 rounded text-center">Item 2</div>
                      <div className="bg-primary-100 p-2 rounded text-center">Item 3</div>
                    </Stack>
                  </div>
                </div>

                <div>
                  <Subheading className="mb-4">Grid Component</Subheading>
                  <div className="border-2 border-dashed border-border-primary p-4">
                    <Grid cols={3} gap={4} className="bg-neutral-50 p-4 rounded">
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 1</div>
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 2</div>
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 3</div>
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 4</div>
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 5</div>
                      <div className="bg-secondary-100 p-2 rounded text-center">Item 6</div>
                    </Grid>
                  </div>
                </div>

                <div>
                  <Subheading className="mb-4">Divider</Subheading>
                  <div className="space-y-4">
                    <div>
                      <Paragraph>Thin Divider</Paragraph>
                      <Divider size={1} />
                    </div>
                    <div>
                      <Paragraph>Medium Divider</Paragraph>
                      <Divider size={2} />
                    </div>
                    <div>
                      <Paragraph>Thick Divider</Paragraph>
                      <Divider size={4} />
                    </div>
                  </div>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* UIコンポーネント */}
          <Card>
            <CardHeader>
              <CardTitle>UIコンポーネント</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack size={6}>
                {/* Buttons */}
                <div>
                  <Subheading className="mb-4">Buttons</Subheading>
                  <Stack size={4} direction="horizontal" wrap>
                    <Button>デフォルト</Button>
                    <Button variant="secondary">セカンダリ</Button>
                    <Button variant="outline">アウトライン</Button>
                    <Button variant="ghost">ゴースト</Button>
                    <Button variant="link">リンク</Button>
                    <Button variant="destructive">削除</Button>
                  </Stack>
                </div>

                {/* Inputs */}
                <div>
                  <Subheading className="mb-4">Inputs</Subheading>
                  <Stack size={4} direction="vertical">
                    <Input label="ラベル付き入力" placeholder="プレースホルダー" />
                    <Input label="エラー状態" error="エラーメッセージ" defaultValue="エラー値" />
                    <Input label="ヘルパーテキスト" helperText="ヘルパーテキストです" placeholder="入力してください" />
                  </Stack>
                </div>

                {/* Select */}
                <div>
                  <Subheading className="mb-4">Select</Subheading>
                  <Select 
                    label="選択肢" 
                    options={[
                      { value: 'option1', label: 'オプション1' },
                      { value: 'option2', label: 'オプション2' },
                      { value: 'option3', label: 'オプション3' },
                    ]}
                    placeholder="選択してください"
                  />
                </div>

                {/* Avatars */}
                <div>
                  <Subheading className="mb-4">Avatars</Subheading>
                  <Stack size={4} direction="horizontal">
                    <Avatar size="sm" fallback="A" />
                    <Avatar size="md" fallback="B" />
                    <Avatar size="lg" fallback="C" />
                    <Avatar size="xl" fallback="D" />
                  </Stack>
                </div>

                {/* Badges */}
                <div>
                  <Subheading className="mb-4">Badges</Subheading>
                  <Stack size={4} direction="horizontal" wrap>
                    <Badge>デフォルト</Badge>
                    <Badge variant="secondary">セカンダリ</Badge>
                    <Badge variant="outline">アウトライン</Badge>
                    <Badge variant="success">成功</Badge>
                    <Badge variant="warning">警告</Badge>
                    <Badge variant="destructive">エラー</Badge>
                  </Stack>
                </div>

                {/* Loading */}
                <div>
                  <Subheading className="mb-4">Loading</Subheading>
                  <Stack size={4} direction="horizontal">
                    <div className="text-center">
                      <Loading size="sm" />
                      <Muted className="mt-2">小</Muted>
                    </div>
                    <div className="text-center">
                      <Loading size="md" />
                      <Muted className="mt-2">中</Muted>
                    </div>
                    <div className="text-center">
                      <Loading size="lg" />
                      <Muted className="mt-2">大</Muted>
                    </div>
                    <div className="text-center">
                      <Loading variant="dots" />
                      <Muted className="mt-2">ドット</Muted>
                    </div>
                  </Stack>
                </div>

                {/* Modal */}
                <div>
                  <Subheading className="mb-4">Modal</Subheading>
                  <Button onClick={() => setIsModalOpen(true)}>
                    モーダルを開く
                  </Button>
                </div>
              </Stack>
            </CardContent>
          </Card>

          {/* デザイントークン */}
          <Card>
            <CardHeader>
              <CardTitle>デザイントークン</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack size={6}>
                <div>
                  <Subheading className="mb-4">Border Radius</Subheading>
                  <Grid cols={4} gap={4}>
                    {Object.entries(tokens.borderRadius).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-16 h-16 bg-primary-100 mx-auto mb-2"
                          style={{ borderRadius: value }}
                        />
                        <Small className="font-mono">{key}</Small>
                        <Muted className="font-mono text-xs">{value}</Muted>
                      </div>
                    ))}
                  </Grid>
                </div>

                <div>
                  <Subheading className="mb-4">Box Shadow</Subheading>
                  <Grid cols={3} gap={4}>
                    {Object.entries(tokens.boxShadow).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-20 h-20 bg-white mx-auto mb-2 rounded-lg"
                          style={{ boxShadow: value }}
                        />
                        <Small className="font-mono">{key}</Small>
                      </div>
                    ))}
                  </Grid>
                </div>

                <div>
                  <Subheading className="mb-4">Font Sizes</Subheading>
                  <div className="space-y-4">
                    {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-mono">{key}</div>
                        <div 
                          className="text-text-primary"
                          style={{ fontSize: value[0] }}
                        >
                          Sample Text
                        </div>
                        <Muted className="font-mono text-xs">{value[0]}</Muted>
                      </div>
                    ))}
                  </div>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="サンプルモーダル"
      >
        <Paragraph className="mb-4">
          これはサンプルのモーダルです。右上の×ボタンまたは背景をクリックして閉じることができます。
        </Paragraph>
        <Stack size={4} direction="horizontal" justify="end">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>
            確認
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}
