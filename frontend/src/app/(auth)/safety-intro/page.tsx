'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function SafetyIntroPage() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      banner: '使えるのは九大生だけ',
      text: [
        '大学基本メールを入力すると、',
        'そのアドレス宛に認証のための',
        'メールが送られます。認証に成',
        '功すると、アプリに登録できま',
        'す。',
        'このシステムにより、大学外の',
        '人がこのアプリを使用すること',
        'を防ぐことができます。'
      ],
      illustration: (
        <div className="relative w-full h-64 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden">
          {/* スマホを持った女性 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {/* 女性の顔と体 */}
            <div className="relative">
              {/* 顔 */}
              <div className="w-16 h-16 bg-purple-200 rounded-full relative">
                {/* 髪 */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-amber-700 rounded-full"></div>
                {/* 目と口 */}
                <div className="absolute top-6 left-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
                <div className="absolute top-6 right-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-neutral-800 rounded-full"></div>
              </div>
              {/* 体 */}
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-purple-200 rounded-b-lg"></div>
              {/* スマホ */}
              <div className="absolute top-20 left-8 w-6 h-10 bg-neutral-600 rounded-lg">
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          {/* アイコン */}
          <div className="absolute top-8 right-12 w-8 h-8 bg-pink-400 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute top-32 left-12 w-8 h-8 bg-blue-400 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="absolute bottom-12 left-16 w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
        </div>
      )
    },
    {
      banner: '匿名や顔出し無しでの登録が可能',
      text: [
        'プロフィール登録時に、「本名」、',
        '「顔写真」、「学年」、「学部」',
        'を公開するかどうかを選択できま',
        'す。'
      ],
      illustration: (
        <div className="relative w-full h-64 bg-amber-50 rounded-lg flex items-center justify-center overflow-hidden">
          {/* 2人の女性 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8">
            {/* 左の女性 */}
            <div className="relative">
              <div className="w-16 h-16 bg-purple-200 rounded-full relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-amber-700 rounded-full"></div>
                <div className="absolute top-6 left-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
                <div className="absolute top-6 right-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
              </div>
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-purple-200 rounded-b-lg"></div>
            </div>
            {/* 右の女性 */}
            <div className="relative">
              <div className="w-16 h-16 bg-purple-200 rounded-full relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-amber-700 rounded-full"></div>
                <div className="absolute top-6 left-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
                <div className="absolute top-6 right-4 w-2 h-2 bg-neutral-800 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-neutral-800 rounded-full"></div>
              </div>
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-purple-200 rounded-b-lg"></div>
            </div>
          </div>
          {/* ハートアイコン */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-pink-400 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )
    }
  ]

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      // 最後のスライドで完了ボタンを押した場合
      router.push('/home')
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const currentSlideData = slides[currentSlide]
  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* バナー */}
          <div className="relative mb-8">
            <div className="w-full bg-pink-500 rounded-full px-6 py-3 text-center">
              <p className="text-white font-bold text-lg">
                {currentSlideData.banner}
              </p>
            </div>
            {/* ナビゲーションボタン */}
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center hover:bg-pink-300 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {!isLastSlide && (
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center hover:bg-pink-300 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* カード */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* テキスト */}
            <div className="mb-6">
              {currentSlideData.text.map((line, index) => (
                <p key={index} className="text-gray-900 text-base leading-relaxed mb-1">
                  {line}
                </p>
              ))}
            </div>

            {/* イラスト */}
            <div className="mb-6">
              {currentSlideData.illustration}
            </div>
          </div>

          {/* 完了ボタン（最後のスライドのみ） */}
          {isLastSlide && (
            <div className="mt-8">
              <Button
                onClick={nextSlide}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-medium text-lg"
              >
                完了
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* インジケーター */}
      <div className="flex justify-center gap-2 pb-8">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentSlide ? 'bg-pink-500' : 'bg-pink-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
