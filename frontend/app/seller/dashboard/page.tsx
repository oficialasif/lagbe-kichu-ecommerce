'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import { useGetSellerDashboardQuery } from '@/store/api/sellerApi'

export default function SellerDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetSellerDashboardQuery(undefined)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'seller') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Seller Dashboard' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Seller Dashboard
        </h1>
        
        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading dashboard...</p>
        ) : data?.data ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Products</h3>
                <p className="text-4xl font-bold text-primary-500">{data.data.stats.totalProducts}</p>
                <p className="text-sm text-white/60 mt-2">
                  {data.data.stats.activeProducts} Active
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Orders</h3>
                <p className="text-4xl font-bold text-blue-400">{data.data.stats.totalOrders}</p>
                <p className="text-sm text-white/60 mt-2">
                  {data.data.stats.completedOrders} Completed
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Total Revenue</h3>
                <p className="text-4xl font-bold text-green-400">৳{data.data.stats.totalRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-white/60 mt-2">
                  From {data.data.stats.completedOrders} orders
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-white/80 mb-2">Avg Order Value</h3>
                <p className="text-4xl font-bold text-yellow-400">৳{data.data.stats.averageOrderValue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Order Statistics */}
            {data.data.orderStats && data.data.orderStats.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Order Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {data.data.orderStats.map((stat: any) => (
                    <div key={stat._id} className="text-center p-4 bg-white/5 rounded-lg">
                      <p className="text-white/60 text-sm mb-2 capitalize">{stat._id}</p>
                      <p className="text-3xl font-bold text-primary-500 mb-1">{stat.count}</p>
                      <p className="text-xs text-white/50">৳{stat.totalAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Performing Products */}
              {data.data.topProducts && data.data.topProducts.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Top Performing Products</h2>
                  <div className="space-y-4">
                    {data.data.topProducts.slice(0, 5).map((product: any, index: number) => (
                      <div key={product.productId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-primary-500">#{index + 1}</span>
                          <div>
                            <p className="text-white font-medium">{product.title}</p>
                            <p className="text-white/60 text-sm">
                              Sold: {product.quantity} units • {product.orderCount} orders
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-500 font-semibold">৳{product.revenue?.toFixed(2)}</p>
                          <p className="text-white/50 text-xs">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {data.data.recentOrders && data.data.recentOrders.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Recent Orders</h2>
                  <div className="space-y-4">
                    {data.data.recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">{order.orderNumber}</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : order.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm mb-1">{order.buyer?.name || 'N/A'}</p>
                        <p className="text-primary-500 font-semibold">৳{order.totalAmount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/seller/products"
            className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
          >
            <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Manage Products</h2>
            <p className="text-white/70">Add, edit, or delete your products</p>
          </Link>
          <Link
            href="/seller/categories"
            className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
          >
            <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Manage Categories</h2>
            <p className="text-white/70">Create and manage product categories</p>
          </Link>
          <Link
            href="/seller/orders"
            className="p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/15 transition-all group"
          >
            <h2 className="text-xl font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">Manage Orders</h2>
            <p className="text-white/70">View and update order status</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

