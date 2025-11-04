'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import { useGetAdminDashboardQuery } from '@/store/api/adminApi'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetAdminDashboardQuery(undefined)

  useEffect(() => {
    // Wait for auth initialization to complete before checking
    if (isInitializing) return
    
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, isInitializing, router])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-white/70">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null
  }

  const stats = data?.data?.stats
  const orderStats = data?.data?.orderStats || []
  const topProducts = data?.data?.topProducts || []
  const topSellers = data?.data?.topSellers || []
  const recentOrders = data?.data?.recentOrders || []

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Admin Dashboard' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Admin Analytics Dashboard
        </h1>

        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading analytics...</p>
        ) : stats ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-primary-500">{stats.totalUsers}</p>
                <p className="text-sm text-white/60 mt-2">
                  {stats.totalSellers} Sellers • {stats.totalBuyers} Buyers
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Products</h3>
                <p className="text-4xl font-bold text-green-400">{stats.totalProducts}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Orders</h3>
                <p className="text-4xl font-bold text-blue-400">{stats.totalOrders}</p>
                <p className="text-sm text-white/60 mt-2">
                  {stats.completedOrders} Completed
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Revenue</h3>
                <p className="text-4xl font-bold text-yellow-400">৳{stats.totalRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-white/60 mt-2">
                  Avg: ৳{stats.averageOrderValue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Order Statistics by Status */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Order Statistics by Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {orderStats.map((stat: any) => (
                  <div key={stat._id} className="text-center">
                    <p className="text-white/60 text-sm mb-1 capitalize">{stat._id}</p>
                    <p className="text-2xl font-bold text-primary-500">{stat.count}</p>
                    <p className="text-xs text-white/50">৳{stat.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Products */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Top Selling Products</h2>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    topProducts.slice(0, 5).map((product: any, index: number) => (
                      <div key={product.productId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-primary-500">#{index + 1}</span>
                          <div>
                            <p className="text-white font-medium">{product.title}</p>
                            <p className="text-white/60 text-sm">Sold: {product.quantity}</p>
                          </div>
                        </div>
                        <p className="text-primary-500 font-semibold">৳{product.revenue?.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/60 text-center py-8">No products sold yet</p>
                  )}
                </div>
              </div>

              {/* Top Sellers */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Top Sellers</h2>
                <div className="space-y-4">
                  {topSellers.length > 0 ? (
                    topSellers.slice(0, 5).map((seller: any, index: number) => (
                      <div key={seller.sellerId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-primary-500">#{index + 1}</span>
                          <div>
                            <p className="text-white font-medium">{seller.name}</p>
                            <p className="text-white/60 text-sm">{seller.orderCount} Orders</p>
                          </div>
                        </div>
                        <p className="text-primary-500 font-semibold">৳{seller.revenue?.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/60 text-center py-8">No sellers yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 divide-y divide-white/20">
                    {recentOrders.map((order: any) => (
                      <tr key={order._id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {order.buyer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {order.seller?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500 font-semibold">
                          ৳{order.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : order.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/admin/users"
                className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
              >
                <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Manage Users</h2>
                <p className="text-white/70">View and manage all users (buyers/sellers)</p>
              </Link>
              <Link
                href="/admin/users?role=seller"
                className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
              >
                <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Sellers</h2>
                <p className="text-white/70">View all seller accounts</p>
              </Link>
              <Link
                href="/admin/users?role=buyer"
                className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
              >
                <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Buyers</h2>
                <p className="text-white/70">View all buyer accounts</p>
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

