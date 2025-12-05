'use client'

import { useState } from 'react'
import type { DiscoverFilters, Sexuality, RelationshipGoal, Sex } from '@/types/search'
import { Button } from '@/components/ui/Button'

interface DiscoverFiltersProps {
  filters: DiscoverFilters
  onFiltersChange: (filters: DiscoverFilters) => void
  onApply: () => void
  onClear: () => void
}

export function DiscoverFilters({ filters, onFiltersChange, onApply, onClear }: DiscoverFiltersProps) {
  const [showSexualityPicker, setShowSexualityPicker] = useState(false)

  // セクシュアリティオプション
  const sexualityOptions: { value: Sexuality; label: string }[] = [
    { value: 'lesbian', label: 'レズビアン' },
    { value: 'bisexual', label: 'バイセクシュアル' },
    { value: 'transgender', label: 'トランスジェンダー' },
    { value: 'gay', label: 'ゲイ' },
    { value: 'asexual', label: 'アセクシュアル' },
    { value: 'pansexual', label: 'パンセクシュアル' },
    { value: 'other', label: 'その他' },
  ]

  // 性別オプション
  const sexOptions: { value: Sex; label: string }[] = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'インターセックス' },
  ]

  // 関係性目標オプション
  const relationshipGoalOptions: { value: RelationshipGoal; label: string }[] = [
    { value: 'friends', label: '友人' },
    { value: 'dating', label: '恋人' },
    { value: 'all', label: 'すべて' },
  ]

  // セクシュアリティ選択のハンドラー
  const handleSexualityToggle = (sexuality: Sexuality) => {
    const currentSexuality = filters.sexuality || []
    const newSexuality = currentSexuality.includes(sexuality)
      ? currentSexuality.filter(s => s !== sexuality)
      : [...currentSexuality, sexuality]
    
    onFiltersChange({ ...filters, sexuality: newSexuality })
  }

  // 性別選択のハンドラー
  const handleSexToggle = (sex: Sex) => {
    const currentSex = filters.sex || []
    const newSex = currentSex.includes(sex)
      ? currentSex.filter(s => s !== sex)
      : [...currentSex, sex]
    
    onFiltersChange({ ...filters, sex: newSex })
  }

  // 関係性目標選択のハンドラー
  const handleRelationshipGoalChange = (goal: RelationshipGoal) => {
    onFiltersChange({ ...filters, relationship_goal: goal })
  }

  // セクシュアリティ表示用のテキスト
  const getSexualityDisplayText = () => {
    if (!filters.sexuality || filters.sexuality.length === 0) {
      return '選択してください'
    }
    return filters.sexuality.map(s => 
      sexualityOptions.find(opt => opt.value === s)?.label
    ).join(', ')
  }

  return (
    <div className="bg-white rounded-t-3xl shadow-lg">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">フィルター</h2>
        <Button
          variant="ghost"
          onClick={onClear}
          className="text-red-500 hover:text-red-600 font-medium"
        >
          クリア
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* セクシュアリティフィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">セクシュアリティ</label>
          <div 
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
            onClick={() => setShowSexualityPicker(!showSexualityPicker)}
          >
            <span className="text-neutral-900">{getSexualityDisplayText()}</span>
            <svg 
              className={`w-5 h-5 text-neutral-400 transition-transform ${showSexualityPicker ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {showSexualityPicker && (
            <div className="mt-3 space-y-2">
              {sexualityOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.sexuality?.includes(option.value) || false}
                    onChange={() => handleSexualityToggle(option.value)}
                    className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                  />
                  <span className="text-neutral-900">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 探している相手フィルター */}
        <div>
          <label className="block text-sm text-neutral-900 mb-3">探している相手</label>
          <div className="flex space-x-3">
            {relationshipGoalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRelationshipGoalChange(option.value)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  filters.relationship_goal === option.value
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 性別フィルター */}
        <div>
          <label className="block text-sm text-neutral-900 mb-3">体の性別</label>
          <div className="space-y-2">
            {sexOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sex?.includes(option.value) || false}
                  onChange={() => handleSexToggle(option.value)}
                  className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                />
                <span className="text-neutral-900">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Continue ボタン */}
      <div className="p-6 pt-0">
        <Button
          onClick={onApply}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-medium text-lg"
        >
          適用
        </Button>
      </div>
    </div>
  )
}
