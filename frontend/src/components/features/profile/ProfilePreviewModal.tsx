import { ReactNode, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { usersApi } from '@/lib/api/users'
import type { TagInfo } from '@/types/search'
import type { UserProfile } from '@/types/user'
import { getAvatarUrl, getImageUrl } from '@/lib/utils/image'

export type ProfilePreviewData = {
  id: number
  display_name: string
  bio?: string | null
  avatar_url?: string | null
  campus?: string | null
  faculty?: string | null
  grade?: string | null
  sexuality?: string | null
  looking_for?: string | null
  tags?: TagInfo[]
  gallery?: string[] | null
}

interface ProfilePreviewContentProps {
  profile?: ProfilePreviewData
  isLoading?: boolean
  actions?: ReactNode
}

const ProfilePreviewContent = ({ profile, isLoading, actions }: ProfilePreviewContentProps) => {
  if (isLoading || !profile) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-neutral-200" />
        <div className="space-y-3 px-2">
          <div className="h-6 bg-neutral-200 rounded-md w-1/2" />
          <div className="h-4 bg-neutral-200 rounded-md w-3/4" />
          <div className="h-4 bg-neutral-200 rounded-md w-full" />
        </div>
      </div>
    )
  }

  const heroImage = profile.avatar_url
    ? getAvatarUrl(profile.avatar_url)
    : profile.gallery?.[0]
      ? getImageUrl(profile.gallery[0])
      : null

  // デバッグログ
  console.log('[ProfilePreviewContent] Profile data:', {
    avatar_url: profile.avatar_url,
    heroImage,
    hasGallery: !!profile.gallery,
    galleryFirst: profile.gallery?.[0],
  })

  const wantOptions = ['友人', '恋人', 'その他']
  const lookingForValue = profile.looking_for || ''

  return (
    <div className="space-y-6">
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-lg">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${profile.display_name}のプロフィール画像`}
            className="h-full w-full object-cover"
            onError={(e) => {
              console.error('[ProfilePreviewContent] Image load error:', {
                src: heroImage,
                profileAvatarUrl: profile.avatar_url,
              })
              // エラー時はプレースホルダーを表示するため、親要素で処理
              const img = e.currentTarget
              img.style.display = 'none'
              const placeholder = img.parentElement?.querySelector('.image-placeholder')
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex'
              }
            }}
            onLoad={() => {
              console.log('[ProfilePreviewContent] Image loaded successfully:', heroImage)
            }}
          />
        ) : null}
        {/* プレースホルダー（画像がない場合、または読み込みエラー時） */}
        {!heroImage && (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-6xl font-bold text-white image-placeholder">
            {profile.display_name?.charAt(0) || '👤'}
          </div>
        )}
        {/* 画像読み込みエラー時のフォールバック */}
        {heroImage && (
          <div className="hidden image-placeholder flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-6xl font-bold text-white">
            {profile.display_name?.charAt(0) || '👤'}
          </div>
        )}
        <div className="absolute inset-x-0 top-4 flex items-center justify-between px-4">
          <div className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-neutral-700">
            プロフィール
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md">
              💕
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white text-2xl shadow-lg">
              ❤
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      </div>

      <div className="space-y-6 px-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              {profile.display_name}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {profile.faculty || profile.grade
                ? [profile.faculty, profile.grade].filter(Boolean).join(' · ')
                : '学部・学年非公開'}
            </p>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        <div className="rounded-3xl bg-neutral-50 px-5 py-4 text-neutral-700 leading-relaxed whitespace-pre-wrap">
          {profile.bio || '自己紹介はまだ設定されていません。'}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-500">セクシュアリティ</h3>
          <div className="flex flex-wrap gap-2">
            {profile.sexuality ? (
              profile.sexuality.split(',').map((item) => (
                <Badge key={item} variant="outline" className="border-pink-200 bg-pink-50 text-pink-600">
                  {item.trim()}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-neutral-500">非公開</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-500">wanting</h3>
          <div className="flex flex-wrap gap-2">
            {wantOptions.map((option) => {
              const isActive = lookingForValue.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  className={`rounded-full border px-4 py-1 text-sm ${
                    isActive
                      ? 'border-primary-300 bg-primary-50 text-primary-600'
                      : 'border-neutral-200 bg-white text-neutral-600'
                  }`}
                  disabled
                >
                  {isActive ? '✓ ' : '　'}
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-500">Tags</h3>
            {profile.tags && profile.tags.length > 3 && (
              <span className="text-xs font-medium text-primary-500">See all</span>
            )}
          </div>
          {profile.tags && profile.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.tags.slice(0, 6).map((tag) => (
                <Badge key={tag.id} variant="outline" className="border-neutral-200 bg-white text-neutral-700">
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">タグはまだ設定されていません。</p>
          )}
        </div>

        {profile.gallery && profile.gallery.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-500">Gallery</h3>
              <span className="text-xs font-medium text-primary-500">See all</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {profile.gallery.slice(0, 6).map((photo, index) => (
                <img
                  key={`${photo}-${index}`}
                  src={getImageUrl(photo) || photo}
                  alt={`${profile.display_name}のギャラリー画像${index + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProfilePreviewModalProps {
  userId: number | null
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<ProfilePreviewData>
  actions?: ReactNode
  footer?: ReactNode
}

export function ProfilePreviewModal({
  userId,
  isOpen,
  onClose,
  initialData,
  actions,
  footer,
}: ProfilePreviewModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => usersApi.getUserProfile(userId!),
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const profile = useMemo<ProfilePreviewData | undefined>(() => {
    if (data) {
      const typed: ProfilePreviewData = {
        id: data.id,
        display_name: data.display_name,
        bio: data.bio,
        avatar_url: data.avatar_url || undefined,
        campus: data.campus,
        faculty: data.faculty,
        grade: data.grade,
        sexuality: data.sexuality,
        looking_for: data.looking_for,
        tags: data.tags ?? [],
      }
      return typed
    }
    if (userId && initialData) {
      return {
        id: userId,
        display_name: initialData.display_name ?? 'ユーザー',
        bio: initialData.bio,
        avatar_url: initialData.avatar_url,
        campus: initialData.campus,
        faculty: initialData.faculty,
        grade: initialData.grade,
        sexuality: initialData.sexuality,
        looking_for: initialData.looking_for,
        tags: initialData.tags ?? [],
        gallery: initialData.gallery ?? null,
      }
    }
    return undefined
  }, [data, initialData, userId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-md md:max-w-2xl bg-transparent shadow-none p-0"
    >
      <div className="mx-auto w-full max-w-md md:max-w-2xl rounded-[32px] bg-white p-6 md:p-8 shadow-xl">
        <ProfilePreviewContent profile={profile} isLoading={isLoading} actions={actions} />
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </Modal>
  )
}

interface ProfilePreviewCardProps {
  profile: ProfilePreviewData
  actions?: ReactNode
  footer?: ReactNode
}

export function ProfilePreviewCard({ profile, actions, footer }: ProfilePreviewCardProps) {
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-lg">
      <ProfilePreviewContent profile={profile} actions={actions} />
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  )
}

export function mapUserProfile(apiProfile: UserProfile): ProfilePreviewData {
  return {
    id: apiProfile.id,
    display_name: apiProfile.display_name,
    bio: apiProfile.bio,
    avatar_url: apiProfile.avatar_url || undefined,
    campus: apiProfile.campus,
    faculty: apiProfile.faculty,
    grade: apiProfile.grade,
    sexuality: apiProfile.sexuality,
    looking_for: apiProfile.looking_for,
    tags: apiProfile.tags ?? [],
  }
}


