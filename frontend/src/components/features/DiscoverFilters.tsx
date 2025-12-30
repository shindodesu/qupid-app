'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DiscoverFilters, Sexuality, RelationshipGoal, Sex, TagInfo } from '@/types/search'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api'

interface DiscoverFiltersProps {
  filters: DiscoverFilters
  onFiltersChange: (filters: DiscoverFilters) => void
  onApply: () => void
  onClear: () => void
}

export function DiscoverFilters({ filters, onFiltersChange, onApply, onClear }: DiscoverFiltersProps) {
  const [showSexualityPicker, setShowSexualityPicker] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [showRelationshipGoalPicker, setShowRelationshipGoalPicker] = useState(false)
  const [showCampusPicker, setShowCampusPicker] = useState(false)
  const [showFacultyPicker, setShowFacultyPicker] = useState(false)
  const [showGradePicker, setShowGradePicker] = useState(false)
  const [showSexPicker, setShowSexPicker] = useState(false)
  const sexualityPickerRef = useRef<HTMLDivElement>(null)
  const tagPickerRef = useRef<HTMLDivElement>(null)
  const relationshipGoalPickerRef = useRef<HTMLDivElement>(null)
  const campusPickerRef = useRef<HTMLDivElement>(null)
  const facultyPickerRef = useRef<HTMLDivElement>(null)
  const gradePickerRef = useRef<HTMLDivElement>(null)
  const sexPickerRef = useRef<HTMLDivElement>(null)

  // タグ一覧取得
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(),
  })

  const allTags = tagsData?.tags || []
  const selectedTags = allTags.filter(tag => filters.tags?.includes(tag.name)) || []

  // ピッカーの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sexualityPickerRef.current && !sexualityPickerRef.current.contains(event.target as Node)) {
        setShowSexualityPicker(false)
      }
      if (tagPickerRef.current && !tagPickerRef.current.contains(event.target as Node)) {
        setShowTagPicker(false)
      }
      if (relationshipGoalPickerRef.current && !relationshipGoalPickerRef.current.contains(event.target as Node)) {
        setShowRelationshipGoalPicker(false)
      }
      if (campusPickerRef.current && !campusPickerRef.current.contains(event.target as Node)) {
        setShowCampusPicker(false)
      }
      if (facultyPickerRef.current && !facultyPickerRef.current.contains(event.target as Node)) {
        setShowFacultyPicker(false)
      }
      if (gradePickerRef.current && !gradePickerRef.current.contains(event.target as Node)) {
        setShowGradePicker(false)
      }
      if (sexPickerRef.current && !sexPickerRef.current.contains(event.target as Node)) {
        setShowSexPicker(false)
      }
    }
    if (showSexualityPicker || showTagPicker || showRelationshipGoalPicker || showCampusPicker || showFacultyPicker || showGradePicker || showSexPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSexualityPicker, showTagPicker, showRelationshipGoalPicker, showCampusPicker, showFacultyPicker, showGradePicker, showSexPicker])

  // セクシュアリティオプション（valueは英語、labelは日本語）
  const sexualityOptions: { value: Sexuality; label: string }[] = [
    { value: 'gay', label: 'ゲイ' },
    { value: 'lesbian', label: 'レズビアン' },
    { value: 'bisexual', label: 'バイセクシュアル' },
    { value: 'transgender', label: 'トランスジェンダー' },
    { value: 'pansexual', label: 'パンセクシュアル' },
    { value: 'asexual', label: 'アセクシュアル' },
    { value: 'other', label: 'その他' },
    { value: 'prefer_not_to_say', label: '回答しない' },
  ]

  // 性別オプション（valueは英語、labelは日本語）
  const sexOptions: { value: Sex; label: string }[] = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'inter_sex', label: 'インターセックス' },
  ]

  // 関係性目標オプション（valueは英語、labelは日本語）
  const relationshipGoalOptions: { value: RelationshipGoal; label: string }[] = [
    { value: 'dating', label: '恋愛関係' },
    { value: 'friends', label: '友達' },
    { value: 'casual', label: 'カジュアルな関係' },
    { value: 'long_term', label: '長期的な関係' },
    { value: 'other', label: 'その他' },
  ]

  // キャンパスオプション
  const campusOptions = [
    '伊都キャンパス', '箱崎キャンパス', '病院キャンパス', '大橋キャンパス'
  ]

  // 学部オプション
  const facultyOptions = [
    '文学部', '教育学部', '法学部', '経済学部', '理学部', '医学部',
    '歯学部', '薬学部', '工学部', '農学部', '芸術工学部', '共創学部'
  ]

  // 学年オプション
  const gradeOptions = [
    '1年', '2年', '3年', '4年', '大学院1年', '大学院2年', '大学院3年以上'
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

  // 関係性目標選択のハンドラー（複数選択対応）
  const handleRelationshipGoalToggle = (goal: RelationshipGoal) => {
    const currentGoals = filters.relationship_goal || []
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal]
    onFiltersChange({ ...filters, relationship_goal: newGoals.length > 0 ? newGoals : undefined })
  }

  // キャンパス選択のハンドラー
  const handleCampusToggle = (campus: string) => {
    const currentCampus = filters.campus || []
    const newCampus = currentCampus.includes(campus)
      ? currentCampus.filter(c => c !== campus)
      : [...currentCampus, campus]
    onFiltersChange({ ...filters, campus: newCampus.length > 0 ? newCampus : undefined })
  }

  // 学部選択のハンドラー
  const handleFacultyToggle = (faculty: string) => {
    const currentFaculty = filters.faculty || []
    const newFaculty = currentFaculty.includes(faculty)
      ? currentFaculty.filter(f => f !== faculty)
      : [...currentFaculty, faculty]
    onFiltersChange({ ...filters, faculty: newFaculty.length > 0 ? newFaculty : undefined })
  }

  // 学年選択のハンドラー
  const handleGradeToggle = (grade: string) => {
    const currentGrade = filters.grade || []
    const newGrade = currentGrade.includes(grade)
      ? currentGrade.filter(g => g !== grade)
      : [...currentGrade, grade]
    onFiltersChange({ ...filters, grade: newGrade.length > 0 ? newGrade : undefined })
  }

  // タグ選択のハンドラー
  const handleTagToggle = (tag: TagInfo) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag.name)
      ? currentTags.filter(t => t !== tag.name)
      : [...currentTags, tag.name]
    onFiltersChange({ ...filters, tags: newTags })
  }

  // セクシュアリティ表示用のテキスト
  const getSexualityDisplayText = () => {
    if (!filters.sexuality || filters.sexuality.length === 0) {
      return '選択してください'
    }
    return `${filters.sexuality.length}個のセクシュアリティを選択中`
  }

  // タグ表示用のテキスト
  const getTagDisplayText = () => {
    if (!filters.tags || filters.tags.length === 0) {
      return '選択してください'
    }
    return `${filters.tags.length}個のタグを選択中`
  }

  // 探している関係表示用のテキスト
  const getRelationshipGoalDisplayText = () => {
    if (!filters.relationship_goal || filters.relationship_goal.length === 0) {
      return '選択してください'
    }
    return `${filters.relationship_goal.length}個の関係を選択中`
  }

  // キャンパス表示用のテキスト
  const getCampusDisplayText = () => {
    if (!filters.campus || filters.campus.length === 0) {
      return '選択してください'
    }
    return `${filters.campus.length}個のキャンパスを選択中`
  }

  // 学部表示用のテキスト
  const getFacultyDisplayText = () => {
    if (!filters.faculty || filters.faculty.length === 0) {
      return '選択してください'
    }
    return `${filters.faculty.length}個の学部を選択中`
  }

  // 学年表示用のテキスト
  const getGradeDisplayText = () => {
    if (!filters.grade || filters.grade.length === 0) {
      return '選択してください'
    }
    return `${filters.grade.length}個の学年を選択中`
  }

  // 体の性別表示用のテキスト
  const getSexDisplayText = () => {
    if (!filters.sex || filters.sex.length === 0) {
      return '選択してください'
    }
    return `${filters.sex.length}個の性別を選択中`
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
        {/* 1. セクシュアリティフィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">セクシュアリティ</label>
          <div className="relative" ref={sexualityPickerRef}>
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
            <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              <div className="p-3 space-y-2">
              {sexualityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                  >
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
            </div>
          )}
          </div>
          {filters.sexuality && filters.sexuality.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.sexuality.map((sexuality) => (
                <span
                  key={sexuality}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {sexualityOptions.find(opt => opt.value === sexuality)?.label}
                  <button
                    type="button"
                    onClick={() => handleSexualityToggle(sexuality)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2. 探している関係フィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">探している関係</label>
          <div className="relative" ref={relationshipGoalPickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowRelationshipGoalPicker(!showRelationshipGoalPicker)}
            >
              <span className="text-neutral-900">{getRelationshipGoalDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showRelationshipGoalPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showRelationshipGoalPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
            {relationshipGoalOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.relationship_goal?.includes(option.value) || false}
                        onChange={() => handleRelationshipGoalToggle(option.value)}
                        className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-neutral-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {filters.relationship_goal && filters.relationship_goal.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.relationship_goal.map((goal) => (
                <span
                  key={goal}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {relationshipGoalOptions.find(opt => opt.value === goal)?.label}
                  <button
                    type="button"
                    onClick={() => handleRelationshipGoalToggle(goal)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3. キャンパスフィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">キャンパス</label>
          <div className="relative" ref={campusPickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowCampusPicker(!showCampusPicker)}
            >
              <span className="text-neutral-900">{getCampusDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showCampusPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showCampusPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {campusOptions.map((campus) => (
                    <label
                      key={campus}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.campus?.includes(campus) || false}
                        onChange={() => handleCampusToggle(campus)}
                        className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-neutral-900">{campus}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {filters.campus && filters.campus.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.campus.map((campus) => (
                <span
                  key={campus}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {campus}
              <button
                    type="button"
                    onClick={() => handleCampusToggle(campus)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 4. 学部フィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">学部</label>
          <div className="relative" ref={facultyPickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowFacultyPicker(!showFacultyPicker)}
            >
              <span className="text-neutral-900">{getFacultyDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showFacultyPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showFacultyPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {facultyOptions.map((faculty) => (
                    <label
                      key={faculty}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.faculty?.includes(faculty) || false}
                        onChange={() => handleFacultyToggle(faculty)}
                        className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-neutral-900">{faculty}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {filters.faculty && filters.faculty.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.faculty.map((faculty) => (
                <span
                  key={faculty}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {faculty}
                  <button
                    type="button"
                    onClick={() => handleFacultyToggle(faculty)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
              </button>
                </span>
            ))}
            </div>
          )}
        </div>

        {/* 5. 学年フィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">学年</label>
          <div className="relative" ref={gradePickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowGradePicker(!showGradePicker)}
            >
              <span className="text-neutral-900">{getGradeDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showGradePicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showGradePicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {gradeOptions.map((grade) => (
                    <label
                      key={grade}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.grade?.includes(grade) || false}
                        onChange={() => handleGradeToggle(grade)}
                        className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-neutral-900">{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {filters.grade && filters.grade.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.grade.map((grade) => (
                <span
                  key={grade}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {grade}
                  <button
                    type="button"
                    onClick={() => handleGradeToggle(grade)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 6. 体の性別フィルター */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">体の性別</label>
          <div className="relative" ref={sexPickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowSexPicker(!showSexPicker)}
            >
              <span className="text-neutral-900">{getSexDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showSexPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showSexPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
            {sexOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
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
            )}
          </div>
          {filters.sex && filters.sex.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.sex.map((sex) => (
                <span
                  key={sex}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {sexOptions.find(opt => opt.value === sex)?.label}
                  <button
                    type="button"
                    onClick={() => handleSexToggle(sex)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* タグ選択（検索フィルターとして最後に配置） */}
        <div>
          <label className="block text-sm text-neutral-600 mb-3">タグ</label>
          <div className="relative" ref={tagPickerRef}>
            <div
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl flex items-center justify-between cursor-pointer hover:bg-neutral-50"
              onClick={() => setShowTagPicker(!showTagPicker)}
            >
              <span className="text-neutral-900">{getTagDisplayText()}</span>
              <svg
                className={`w-5 h-5 text-neutral-400 transition-transform ${showTagPicker ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {showTagPicker && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-3 space-y-2">
                  {allTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.tags?.includes(tag.name) || false}
                        onChange={() => handleTagToggle(tag)}
                        className="w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-neutral-900">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className="ml-2 text-pink-700 hover:text-pink-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
