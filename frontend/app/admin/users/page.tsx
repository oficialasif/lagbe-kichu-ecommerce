'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetAllUsersQuery, useBanUserMutation } from '@/store/api/adminApi'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || undefined
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useGetAllUsersQuery({ role, page, limit: 10 })
  const [banUser] = useBanUserMutation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  const handleBan = async (userId: string, isBanned: boolean) => {
    try {
      await banUser({ userId, isBanned }).unwrap()
      showToast(`User ${isBanned ? 'banned' : 'unbanned'} successfully`, 'success')
    } catch (error: any) {
      showToast(error?.data?.message || 'Failed to update user status', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Admin Dashboard', href: '/admin/dashboard' },
            { label: 'Manage Users' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Manage Users</h1>
        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading...</p>
        ) : error ? (
          <p className="text-red-400 text-center py-12">Error loading users</p>
        ) : data?.data ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/20">
                  {data.data.users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' 
                            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                            : user.role === 'seller'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isBanned
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}
                        >
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleBan(user.id, !user.isBanned)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            user.isBanned
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                          }`}
                        >
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

