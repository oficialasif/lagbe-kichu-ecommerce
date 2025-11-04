'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetBuyerOrdersQuery } from '@/store/api/orderApi'
import Link from 'next/link'

export default function BuyerOrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetBuyerOrdersQuery({ page: 1, limit: 10 })

  useEffect(() => {
    if (isInitializing) return
    
    if (!isAuthenticated || user?.role !== 'buyer') {
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

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-12 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Orders' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">My Orders</h1>
        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading orders...</p>
        ) : data?.data ? (
          <div className="space-y-4">
            {data.data.orders.map((order: any) => (
              <Link
                key={order._id}
                href={`/buyer/orders/${order._id}`}
                className="block bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-500 transition-colors">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-white/70 mb-1">Seller: <span className="text-primary-500">{order.seller?.name || 'N/A'}</span></p>
                    <p className="text-white/70 mb-1">Total: <span className="text-primary-500 font-semibold">৳{order.totalAmount}</span></p>
                    <p className="text-sm text-white/50">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      order.status === 'completed'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : order.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-white/70 text-center py-12">No orders found</p>
        )}
      </div>
    </div>
  )
}

