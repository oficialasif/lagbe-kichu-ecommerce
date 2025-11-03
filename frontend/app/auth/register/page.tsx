'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegisterMutation } from '@/store/api/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['seller', 'buyer']),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [register, { isLoading, error }] = useRegisterMutation()

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'buyer',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register(data).unwrap()
      if (result.success && result.data) {
        showToast('Account created successfully!', 'success')
        dispatch(
          setCredentials({
            user: result.data.user,
            accessToken: result.data.accessToken,
          })
        )

        // Redirect based on role
        if (result.data.user.role === 'seller') {
          router.push('/seller/dashboard')
        } else {
          router.push('/buyer/products')
        }
      }
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || 'Registration failed. Please try again.'
      showToast(errorMessage, 'error')
      
      // If email already exists, suggest logging in
      if (errorMessage.includes('already exists') || errorMessage.includes('User already exists')) {
        setTimeout(() => {
          showToast('This email is already registered. Try logging in instead.', 'info')
        }, 2000)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div>
          <Link href="/" className="flex items-center mb-8 text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
          <h2 className="text-center text-4xl font-extrabold text-white mb-2">
            Create your account
          </h2>
          <p className="text-center text-sm text-white/70">
            Or{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 p-4">
              <p className="text-sm text-red-300 mb-2">
                {(error as any)?.data?.message || (error as any)?.message || 'Registration failed'}
              </p>
              {((error as any)?.data?.message || (error as any)?.message || '').includes('already exists') && (
                <Link 
                  href="/auth/login"
                  className="text-sm text-primary-400 hover:text-primary-300 underline transition-colors"
                >
                  Try logging in instead →
                </Link>
              )}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Name
              </label>
              <input
                {...registerForm('name')}
                type="text"
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                {...registerForm('email')}
                type="email"
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                {...registerForm('password')}
                type="password"
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-white/80 mb-2">
                Account Type
              </label>
              <select
                {...registerForm('role')}
                className="block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
              >
                <option value="buyer" className="bg-dark-900">Buyer</option>
                <option value="seller" className="bg-dark-900">Seller</option>
              </select>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                Phone (Optional)
              </label>
              <input
                {...registerForm('phone')}
                type="tel"
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
                placeholder="Enter your phone"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-white/80 mb-2">
                Address (Optional)
              </label>
              <textarea
                {...registerForm('address')}
                rows={3}
                className="appearance-none relative block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all resize-none"
                placeholder="Enter your address"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/30"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

