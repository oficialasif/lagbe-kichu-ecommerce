'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'seller' | 'buyer')[]
  requireAuth?: boolean
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Wait for auth initialization to complete before checking
    if (isInitializing) return

    if (requireAuth && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (requireAuth && allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push('/auth/login')
      return
    }
  }, [isAuthenticated, user, isInitializing, router, requireAuth, allowedRoles])

  // Show loading while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-white/70">Loading...</p>
      </div>
    )
  }

  // Show nothing if not authenticated or wrong role
  if (requireAuth && (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role)))) {
    return null
  }

  return <>{children}</>
}

