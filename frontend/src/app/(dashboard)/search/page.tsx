'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchApi } from '@/lib/api/search'
import { apiClient } from '@/lib/api'
import { SearchForm, UserList, Pagination } from '@/components/features/search'
import type { SearchFilters, UserSearchResponse } from '@/types/search'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  // URLパラメータから検索フィルターを取得
  const getFiltersFromUrl = (): SearchFilters => {
    const filters: SearchFilters = {}
    
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      filters.tags = tagsParam.split(',')
    }
    
    const facultyParam = searchParams.get('faculty')
    if (facultyParam) {
      filters.faculty = facultyParam
    }
    
    const gradeParam = searchParams.get('grade')
    if (gradeParam) {
      filters.grade = gradeParam
    }
    
    const searchParam = searchParams.get('search')
    if (searchParam) {
      filters.search = searchParam
    }
    
    const sortParam = searchParams.get('sort')
    if (sortParam) {
      filters.sort = sortParam as any
    }
    
    const offsetParam = searchParams.get('offset')
    if (offsetParam) {
      filters.offset = parseInt(offsetParam, 10)
    }
    
    return filters
  }

  const [filters, setFilters] = useState<SearchFilters>(getFiltersFromUrl())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // URLを更新
  const updateUrl = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','))
    }
    
    if (newFilters.faculty) {
      params.set('faculty', newFilters.faculty)
    }
    
    if (newFilters.grade) {
      params.set('grade', newFilters.grade)
    }
    
    if (newFilters.search) {
      params.set('search', newFilters.search)
    }
    
    if (newFilters.sort) {
      params.set('sort', newFilters.sort)
    }
    
    if (newFilters.offset) {
      params.set('offset', String(newFilters.offset))
    }
    
    const queryString = params.toString()
    router.push(`/search${queryString ? `?${queryString}` : ''}`)
  }

  // タグ一覧取得
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags(),
  })

  // ユーザー検索
  const { data: searchData, isLoading, error } = useQuery<UserSearchResponse>({
    queryKey: ['search', filters],
    queryFn: () => searchApi.searchUsers({
      ...filters,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    }),
  })

  // いいね送信
  const likeMutation = useMutation({
    mutationFn: (userId: number) => searchApi.sendLike(userId),
    onSuccess: (data, userId) => {
      // 検索結果を再取得
      queryClient.invalidateQueries({ queryKey: ['search'] })
      
      // マッチ成立の場合
      if (data.is_match) {
        alert('🎉 マッチしました！')
      }
    },
    onError: (error) => {
      alert('いいねの送信に失敗しました')
      console.error(error)
    },
  })

  // いいね取り消し
  const unlikeMutation = useMutation({
    mutationFn: (userId: number) => searchApi.removeLike(userId),
    onSuccess: () => {
      // 検索結果を再取得
      queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (error) => {
      alert('いいねの取り消しに失敗しました')
      console.error(error)
    },
  })

  // 検索実行
  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    updateUrl({ ...newFilters, offset: 0 })
  }

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const offset = (page - 1) * itemsPerPage
    const newFilters = { ...filters, offset }
    setFilters(newFilters)
    updateUrl(newFilters)
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // いいね送信
  const handleLike = async (userId: number) => {
    await likeMutation.mutateAsync(userId)
  }

  // いいね取り消し
  const handleUnlike = async (userId: number) => {
    await unlikeMutation.mutateAsync(userId)
  }

  const totalPages = searchData ? Math.ceil(searchData.total / itemsPerPage) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          ユーザーを探す
        </h1>
        <p className="text-neutral-600">
          タグや条件で絞り込んで、気になるユーザーを見つけましょう
        </p>
      </div>

      {/* 検索フォーム */}
      <div className="mb-8 bg-white rounded-lg border border-neutral-200 p-6">
        <SearchForm
          onSearch={handleSearch}
          initialFilters={filters}
          availableTags={tagsData?.tags || []}
        />
      </div>

      {/* 検索結果 */}
      <div className="mb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            検索中にエラーが発生しました
          </div>
        )}

        {searchData && (
          <div className="mb-4 text-sm text-neutral-600">
            {searchData.total > 0 ? (
              <>
                <span className="font-medium">{searchData.total}</span> 件のユーザーが見つかりました
              </>
            ) : (
              '条件に一致するユーザーが見つかりませんでした'
            )}
          </div>
        )}

        <UserList
          users={searchData?.users || []}
          onLike={handleLike}
          onUnlike={handleUnlike}
          isLoading={isLoading}
        />
      </div>

      {/* ページネーション */}
      {searchData && searchData.total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={searchData.total}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

