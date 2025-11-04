'use client'

import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useGetCurrentUserQuery } from '@/store/api/authApi'
import { setUser, logout, setInitializing } from '@/store/slices/authSlice'
import Cookies from 'js-cookie'

export default function AuthInitializer() {
  const dispatch = useAppDispatch()
  const { accessToken, isAuthenticated, isInitializing } = useAppSelector((state) => state.auth)
  const hasToken = !!accessToken || !!Cookies.get('accessToken')

  // Only fetch if we have a token but user is not authenticated
  const { data, error, isSuccess, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !hasToken || isAuthenticated,
    refetchOnMountOrArgChange: false,
  })

  useEffect(() => {
    // If no token, mark as initialized immediately
    if (!hasToken && isInitializing) {
      dispatch(setInitializing(false))
      return
    }

    // If already authenticated, mark as initialized
    if (isAuthenticated && isInitializing) {
      dispatch(setInitializing(false))
      return
    }

    // Don't restore session if we're not authenticated and no token (likely logged out)
    if (!isAuthenticated && !hasToken && isInitializing) {
      dispatch(setInitializing(false))
      return
    }

    // Wait for query to complete
    if (!isLoading && (isSuccess || error)) {
      if (isSuccess && data?.success && data?.data?.user && !isAuthenticated) {
        // Only restore if we have valid data and are not already authenticated
        // This prevents restoring after logout
        dispatch(setUser(data.data.user))
      } else if (error && 'status' in error && (error.status === 401 || error.status === 403)) {
        // Token is invalid, clear auth state
        dispatch(logout())
        dispatch(setInitializing(false))
      } else if (!isLoading && !hasToken) {
        // No token and query completed
        dispatch(setInitializing(false))
      } else if (!isLoading && isSuccess && !data?.success) {
        // Query completed but no valid data
        dispatch(setInitializing(false))
      }
    }
  }, [isSuccess, data, error, isLoading, hasToken, isAuthenticated, isInitializing, dispatch])

  return null
}

