'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { useLogoutMutation } from '@/store/api/authApi'
import { useRouter } from 'next/navigation'
import Cart from './Cart'

export default function Navbar() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [logoutApi] = useLogoutMutation()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleLogout = async () => {
    try {
      // Close dropdown first
      setShowDropdown(false)
      // Clear logout state immediately (before API call)
      dispatch(logout())
      // Call logout API (but don't wait for it)
      logoutApi({}).catch(() => {
        // Ignore errors - we've already cleared local state
      })
      // Force a full page reload to clear all state
      window.location.href = '/'
    } catch (error) {
      // Even if something fails, clear local state and reload
      dispatch(logout())
      setShowDropdown(false)
      window.location.href = '/'
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleRoute = () => {
    if (!user) return '/'
    if (user.role === 'admin') return '/admin/dashboard'
    if (user.role === 'seller') return '/seller/dashboard'
    return '/buyer/products'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
            lagbe<span className="text-primary-500">kichu</span>.
          </Link>
          <div className="flex items-center space-x-6">
            {isAuthenticated && user?.role === 'buyer' && <Cart />}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-primary-400">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-white/90 text-sm font-medium hidden md:block">
                    {user.name}
                  </span>
                  <svg
                    className={`w-5 h-5 text-white/70 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-white/70 text-sm">{user.email}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-2">
                      <Link
                        href={getRoleRoute()}
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>
                      {user.role === 'buyer' && (
                        <Link
                          href="/buyer/orders"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          My Orders
                        </Link>
                      )}
                      {user.role === 'seller' && (
                        <>
                          <Link
                            href="/seller/products"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            My Products
                          </Link>
                          <Link
                            href="/seller/orders"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Order Management
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setShowDropdown(false)
                          handleLogout()
                        }}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-2 text-white/90 hover:text-white transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-medium shadow-lg shadow-primary-500/30"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

