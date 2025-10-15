'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from '@/hooks/useAuth'
import { Loading } from '@/components/ui'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = <Loading />, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthState()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface GuestGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
}

export function GuestGuard({ 
  children, 
  fallback = <Loading />, 
  redirectTo = '/home' 
}: GuestGuardProps) {
  const { isAuthenticated, isLoading } = useAuthState()
  const router = useRouter()

  useEffect(() => {
    console.log('GuestGuard:', { isLoading, isAuthenticated })
    if (!isLoading && isAuthenticated) {
      console.log('GuestGuard: redirecting to', redirectTo)
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return <>{fallback}</>
  }

  if (isAuthenticated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
