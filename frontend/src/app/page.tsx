'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useIsAuthenticated, useAuthLoading } from '@/stores/auth'
import { Button, Container, Stack, Heading, Paragraph, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { 
  Shield, 
  Users, 
  Heart, 
  MessageCircle, 
  Lock, 
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react'

// リップルエフェクトコンポーネント
function RippleButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      
      setRipples(prev => [...prev, { x, y, id }])
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id))
      }, 600)
    }
    
    props.onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      {...props}
      onClick={handleClick}
    >
      {children}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            initial={{ width: 0, height: 0, x: ripple.x, y: ripple.y, opacity: 1 }}
            animate={{ width: 300, height: 300, x: ripple.x - 150, y: ripple.y - 150, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </button>
  )
}

// マグネットリンクコンポーネント
function MagnetLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    setPosition({ x: x * 0.3, y: y * 0.3 })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: position.x,
        y: position.y,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.a>
  )
}

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const isLoading = useAuthLoading()
  const hasRedirected = useRef(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const { scrollY } = useScroll()
  const navBackground = useTransform(scrollY, [0, 100], ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.95)'])
  const navShadow = useTransform(scrollY, [0, 100], ['0 1px 3px rgba(0, 0, 0, 0.1)', '0 4px 6px rgba(0, 0, 0, 0.15)'])
  const navBackgroundSpring = useSpring(navBackground, { stiffness: 100, damping: 30 })
  const navShadowSpring = useSpring(navShadow, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setNavScrolled(latest > 50)
    })
    return () => unsubscribe()
  }, [scrollY])

  useEffect(() => {
    // ローディング中はリダイレクトしない
    if (isLoading || hasRedirected.current) {
      return
    }

    // 認証状態が確定したらリダイレクト
    hasRedirected.current = true
    if (isAuthenticated) {
      router.replace('/home')
    }
    // 未認証の場合はランディングページを表示（リダイレクトしない）
  }, [isAuthenticated, isLoading, router])

  // ローディング中または認証済みの場合はローディング表示
  if (isLoading || (isAuthenticated && hasRedirected.current)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <motion.div
            className="inline-block rounded-full h-12 w-12 border-4 border-orange-200"
            style={{ borderTopColor: '#FF6B9D' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-neutral-600 font-medium"
          >
            読み込み中...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // 未認証ユーザーにはランディングページを表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
      {/* ナビゲーションバー */}
      <motion.nav
        style={{
          backgroundColor: navBackgroundSpring,
          boxShadow: navShadowSpring,
        }}
        className="border-b border-orange-200/50 backdrop-blur-md sticky top-0 z-50 transition-all duration-300"
      >
        <Container className="py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-6 w-6 text-[#FF6B9D]" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] via-[#FF9A8B] to-[#FFB4A8] bg-clip-text text-transparent">
                Qupid
              </span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" size="sm" className="text-neutral-700 hover:text-[#FF6B9D] relative group">
                    ログイン
                    <motion.span
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF6B9D] group-hover:w-full transition-all duration-300"
                    />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/register">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="sm" className="bg-gradient-to-r from-[#FF6B9D] to-[#FF9A8B] hover:from-[#FF8FA3] hover:to-[#FFB4A8] text-white border-0 shadow-md hover:shadow-lg transition-all">
                    新規登録
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </Container>
      </motion.nav>

      {/* ヒーローセクション */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* 装飾的な背景要素 - 浮遊アニメーション */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(255, 107, 157, 0.15)' }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(255, 154, 139, 0.15)' }}
            animate={{
              y: [0, 30, 0],
              x: [0, -20, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(255, 180, 168, 0.15)' }}
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </div>
        
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Heading className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-[#FF6B9D] via-[#FF9A8B] to-[#FFB4A8] bg-clip-text text-transparent">
                九州大学のLGBTQ+学生のための
                <br />
                安心・安全なマッチングアプリ
              </Heading>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-neutral-700 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Qupidは、九州大学内のLGBTQ+当事者学生が、匿名で安心して恋人・友人とつながることを支援するマッチングアプリです。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <Link href="/auth/register">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RippleButton className="group bg-gradient-to-r from-[#FF6B9D] to-[#FF9A8B] hover:from-[#FF8FA3] hover:to-[#FFB4A8] text-white border-0 shadow-lg hover:shadow-xl transition-all px-8 py-3 rounded-md font-semibold flex items-center">
                    今すぐ始める
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.div>
                  </RippleButton>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="outline" size="lg" className="border-[#FFB4A8] text-[#FF6B9D] hover:bg-orange-50 relative group overflow-hidden">
                    ログイン
                    <motion.span
                      className="absolute inset-0 bg-orange-50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-10"
                    />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 bg-white/60 backdrop-blur-sm">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Heading variant="h2" className="mb-4 bg-gradient-to-r from-[#FF6B9D] to-[#FF9A8B] bg-clip-text text-transparent">
              Qupidの特徴
            </Heading>
            <Paragraph className="text-lg text-neutral-700 max-w-2xl mx-auto">
              あなたの安心と安全を最優先に設計された機能
            </Paragraph>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: '匿名性の保護',
                description: '顔出し不要で、プライバシーを徹底的に保護します。あなたの情報は安全に管理されます。',
                gradient: 'from-[#FFE5E5] to-[#FFF0F0]',
                iconBg: 'from-[#FF6B9D] to-[#FF8FA3]',
              },
              {
                icon: Lock,
                title: '学内限定',
                description: '九州大学のメールアドレス（@s.kyushu-u.ac.jp）でのみ登録可能。学内限定で安心して利用できます。',
                gradient: 'from-[#FFE8E0] to-[#FFF4F0]',
                iconBg: 'from-[#FF9A8B] to-[#FFB4A8]',
              },
              {
                icon: Sparkles,
                title: 'タグベースマッチング',
                description: '興味や価値観をタグで表現し、共通点のある人と自然に出会えます。',
                gradient: 'from-[#FFF0E8] to-[#FFF8F5]',
                iconBg: 'from-[#FFB4A8] to-[#FFC4B8]',
              },
              {
                icon: Heart,
                title: 'いいね・マッチング',
                description: '気になる人にいいねを送り、両想いになったらマッチング成立。自然な出会いをサポートします。',
                gradient: 'from-[#FFE5E5] to-[#FFEBEB]',
                iconBg: 'from-[#FF6B9D] to-[#FFA8C5]',
              },
              {
                icon: MessageCircle,
                title: 'リアルタイムチャット',
                description: 'マッチした人とリアルタイムでチャットできます。テキストや音声メッセージでコミュニケーション。',
                gradient: 'from-[#FFE8E0] to-[#FFF0EB]',
                iconBg: 'from-[#FF9A8B] to-[#FFB8A8]',
              },
              {
                icon: CheckCircle2,
                title: 'セーフティ機能',
                description: '不適切な行為への通報機能やブロック機能を完備。安心して利用できる環境を提供します。',
                gradient: 'from-[#FFF0E8] to-[#FFF5F0]',
                iconBg: 'from-[#FFB4A8] to-[#FFC8B8]',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100,
                }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.05, 
                    y: -8,
                    rotateY: 5,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="h-full"
                >
                  <Card className={`h-full border-0 bg-gradient-to-br ${feature.gradient} hover:shadow-2xl transition-all duration-300 cursor-pointer group`}>
                    <CardHeader>
                      <motion.div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center mb-4 shadow-lg`}
                        whileHover={{ 
                          rotate: [0, -10, 10, -10, 0],
                          scale: 1.1,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <CardTitle className="text-neutral-800 group-hover:text-[#FF6B9D] transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-neutral-700">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B9D] to-[#FF9A8B] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                    />
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* 安全性セクション */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50">
        <Container>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Heading variant="h2" className="mb-4 bg-gradient-to-r from-[#FF6B9D] to-[#FF9A8B] bg-clip-text text-transparent">
                安全性への取り組み
              </Heading>
              <Paragraph className="text-lg text-neutral-700">
                あなたの安心を最優先に考えたセーフティ機能
              </Paragraph>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className="border-0 bg-gradient-to-br from-[#FFE5E5]/80 to-white shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D]/0 to-[#FF9A8B]/0 group-hover:from-[#FF6B9D]/10 group-hover:to-[#FF9A8B]/10 transition-all duration-300"
                    />
                    <CardHeader className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <motion.div
                          className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#FF8FA3] flex items-center justify-center shadow-md"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Shield className="h-5 w-5 text-white" />
                        </motion.div>
                        <CardTitle className="text-neutral-800 group-hover:text-[#FF6B9D] transition-colors">
                          通報・ブロック機能
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Paragraph className="text-neutral-700">
                        不適切な行為や不快なユーザーを簡単に通報・ブロックできます。管理者が迅速に対応します。
                      </Paragraph>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Card className="border-0 bg-gradient-to-br from-[#FFE8E0]/80 to-white shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[#FF9A8B]/0 to-[#FFB4A8]/0 group-hover:from-[#FF9A8B]/10 group-hover:to-[#FFB4A8]/10 transition-all duration-300"
                    />
                    <CardHeader className="relative z-10">
                      <div className="flex items-center space-x-3 mb-4">
                        <motion.div
                          className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF9A8B] to-[#FFB4A8] flex items-center justify-center shadow-md"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Users className="h-5 w-5 text-white" />
                        </motion.div>
                        <CardTitle className="text-neutral-800 group-hover:text-[#FF9A8B] transition-colors">
                          学内限定コミュニティ
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Paragraph className="text-neutral-700">
                        九州大学の学生のみが参加できるクローズドなコミュニティ。同じキャンパスで安心して出会えます。
                      </Paragraph>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTAセクション */}
      <section className="py-20 bg-gradient-to-r from-[#FF6B9D] via-[#FF9A8B] to-[#FFB4A8] relative overflow-hidden">
        {/* 装飾的な背景要素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: 'linear-gradient(to bottom right, rgba(255, 107, 157, 0.2), rgba(255, 154, 139, 0.2), rgba(255, 180, 168, 0.2))',
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
        </div>
        
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg"
              animate={{
                textShadow: [
                  '0 2px 10px rgba(0,0,0,0.2)',
                  '0 4px 20px rgba(255,255,255,0.3)',
                  '0 2px 10px rgba(0,0,0,0.2)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              素敵な出会いを見つけましょう
            </motion.h2>
            <Paragraph className="text-xl text-white/90 mb-8 drop-shadow-md">
              九州大学のLGBTQ+学生のための、安心・安全なマッチングアプリ
            </Paragraph>
            <Link href="/auth/register">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <RippleButton className="bg-white text-[#FF6B9D] hover:bg-orange-50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-semibold px-8 py-4 rounded-md flex items-center mx-auto">
                  今すぐ無料で始める
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.div>
                </RippleButton>
              </motion.div>
            </Link>
          </motion.div>
        </Container>
      </section>

      {/* フッター */}
      <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-neutral-300 py-12">
        <Container>
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5 text-[#FF8FA3]" />
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#FF8FA3] to-[#FFB4A8] bg-clip-text text-transparent">
                  Qupid
                </span>
              </div>
              <Paragraph className="text-sm text-neutral-400">
                九州大学のLGBTQ+学生のためのマッチングアプリ
              </Paragraph>
            </motion.div>
            {[
              { title: '利用規約', links: ['利用規約', 'プライバシーポリシー'], hrefs: ['/terms', '/privacy'] },
              { title: 'サポート', links: ['安全性について', 'お問い合わせ'], hrefs: ['/help/safety', '/support'] },
              { title: 'アカウント', links: ['ログイン', '新規登録'], hrefs: ['/auth/login', '/auth/register'] },
            ].map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              >
                <Heading variant="h6" className="text-white mb-4">
                  {section.title}
                </Heading>
                <Stack size={2}>
                  {section.links.map((link, linkIndex) => (
                    <MagnetLink
                      key={link}
                      href={section.hrefs[linkIndex]}
                      className="text-sm text-neutral-400 hover:text-white transition-colors relative group"
                    >
                      {link}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF8FA3] group-hover:w-full transition-all duration-300"
                      />
                    </MagnetLink>
                  ))}
                </Stack>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="border-t border-neutral-800 pt-8 text-center"
          >
            <Paragraph className="text-sm text-neutral-500">
              © 2025 Qupid. All rights reserved.
            </Paragraph>
          </motion.div>
        </Container>
      </footer>
    </div>
  )
}
