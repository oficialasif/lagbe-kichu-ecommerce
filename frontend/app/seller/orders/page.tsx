'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetSellerOrdersQuery, useUpdateOrderStatusMutation } from '@/store/api/sellerApi'
import Link from 'next/link'

export default function SellerOrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetSellerOrdersQuery({ page, limit: 10 })
  const [updateStatus] = useUpdateOrderStatusMutation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateStatus({ id: orderId, status }).unwrap()
    } catch (error) {
      alert('Failed to update order status')
    }
  }

  if (!isAuthenticated || user?.role !== 'seller') {
    return null
  }

  const statusOptions = [
    'pending',
    'approved',
    'rejected',
    'processing',
    'out-for-delivery',
    'completed',
  ]

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Seller Dashboard', href: '/seller/dashboard' },
            { label: 'Orders' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Orders</h1>
        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading orders...</p>
        ) : data?.data ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                      Total
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
                  {data.data.orders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {order.buyer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500 font-semibold">
                        ৳{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : order.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status} className="bg-dark-900">
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-white/70 text-center py-12">No orders found</p>
        )}
      </div>
    </div>
  )
}

