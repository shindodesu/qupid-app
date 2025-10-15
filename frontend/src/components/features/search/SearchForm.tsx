'use client'

import { useState, useEffect, memo } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useDebounce } from '@/hooks/useDebounce'
import type { SearchFilters, SortOrder } from '@/types/search'

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
  availableTags?: { id: number; name: string }[]
}

export const SearchForm = memo(function SearchForm({ onSearch, initialFilters = {}, availableTags = [] }: SearchFormProps) {
  const [searchText, setSearchText] = useState(initialFilters.search || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tags || [])
  const [faculty, setFaculty] = useState(initialFilters.faculty || '')
  const [grade, setGrade] = useState(initialFilters.grade || '')
  const [sort, setSort] = useState<SortOrder>(initialFilters.sort || 'recent')
  
  // デバウンス処理（検索テキストの入力から500ms後に検索実行）
  const debouncedSearchText = useDebounce(searchText, 500)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const filters: SearchFilters = {
      search: searchText || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      faculty: faculty || undefined,
      grade: grade || undefined,
      sort,
    }
    
    onSearch(filters)
  }

  const handleReset = () => {
    setSearchText('')
    setSelectedTags([])
    setFaculty('')
    setGrade('')
    setSort('recent')
    onSearch({})
  }

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  // 九州大学の学部リスト
  const faculties = [
    { value: '', label: 'すべて' },
    { value: '文学部', label: '文学部' },
    { value: '教育学部', label: '教育学部' },
    { value: '法学部', label: '法学部' },
    { value: '経済学部', label: '経済学部' },
    { value: '理学部', label: '理学部' },
    { value: '医学部', label: '医学部' },
    { value: '歯学部', label: '歯学部' },
    { value: '薬学部', label: '薬学部' },
    { value: '工学部', label: '工学部' },
    { value: '芸術工学部', label: '芸術工学部' },
    { value: '農学部', label: '農学部' },
    { value: '共創学部', label: '共創学部' },
  ]

  const grades = [
    { value: '', label: 'すべて' },
    { value: '1年生', label: '1年生' },
    { value: '2年生', label: '2年生' },
    { value: '3年生', label: '3年生' },
    { value: '4年生', label: '4年生' },
    { value: '修士1年', label: '修士1年' },
    { value: '修士2年', label: '修士2年' },
    { value: '博士1年', label: '博士1年' },
    { value: '博士2年', label: '博士2年' },
    { value: '博士3年', label: '博士3年' },
  ]

  const sortOptions = [
    { value: 'recent', label: '新しい順' },
    { value: 'alphabetical', label: '名前順' },
    { value: 'popular', label: '人気順' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* フリーテキスト検索 */}
        <Input
          type="text"
          placeholder="名前や自己紹介で検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          label="キーワード検索"
        />

        {/* 学部フィルター */}
        <Select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          options={faculties}
          label="学部"
        />

        {/* 学年フィルター */}
        <Select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          options={grades}
          label="学年"
        />

        {/* 並び順 */}
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOrder)}
          options={sortOptions}
          label="並び順"
        />
      </div>

      {/* タグフィルター */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-900">タグで絞り込み</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.slice(0, 20).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-primary-300'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-3">
        <Button type="submit" variant="default">
          検索
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          リセット
        </Button>
      </div>
    </form>
  )
})

