'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetOrderDetailsQuery, useCreateReviewMutation } from '@/store/api/orderApi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetOrderDetailsQuery(id as string)
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'buyer') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  const onSubmitReview = async (data: ReviewFormData) => {
    try {
      await createReview({ orderId: id as string, reviewData: data }).unwrap()
      alert('Review submitted successfully!')
    } catch (error: any) {
      alert(error?.data?.message || 'Failed to submit review')
    }
  }

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 py-12 relative z-10">
          <p className="text-white/70 text-center py-12">Loading order...</p>
        </div>
      </div>
    )
  }

  const order = data?.data?.order

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 py-12 relative z-10">
          <p className="text-white/70 text-center py-12">Order not found</p>
        </div>
      </div>
    )
  }

  // Calculate estimated delivery date (5-7 business days)
  const orderDate = new Date(order.createdAt)
  const estimatedDelivery = new Date(orderDate)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7)

  // Status timeline
  const getStatusSteps = () => {
    const statuses = ['pending', 'approved', 'processing', 'out-for-delivery', 'completed']
    const currentStatusIndex = statuses.indexOf(order.status)
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex,
    }))
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-12 relative z-10 flex-1">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Orders', href: '/buyer/orders' },
            { label: `Order ${order?.orderNumber || ''}` },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Order Details</h1>

        {/* Order Header Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Order #{order.orderNumber}</h2>
              <div className="space-y-1 text-sm">
                <p className="text-white/70">
                  Ordered on: <span className="text-primary-400 font-medium">{new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
                <p className="text-white/70">
                  Order time: <span className="text-primary-400">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
                {order.updatedAt && (
                  <p className="text-white/50 text-xs">
                    Last updated: {new Date(order.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold inline-block ${
                  order.status === 'completed'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : order.status === 'rejected'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : order.status === 'cancelled'
                    ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
              </span>
              <p className="text-white/70 text-sm">
                Estimated delivery: <span className="text-primary-400">{estimatedDelivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-white font-semibold mb-4">Order Status</h3>
            <div className="flex flex-wrap gap-4">
              {statusSteps.map((step, index) => (
                <div key={step.status} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                      step.completed
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : step.current
                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                        : 'bg-white/5 border-white/20 text-white/40'
                    }`}
                  >
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${
                      step.completed
                        ? 'text-primary-400'
                        : step.current
                        ? 'text-primary-500'
                        : 'text-white/40'
                    }`}
                  >
                    {step.status.replace('-', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-6 text-white">Order Items ({order.items?.length || 0})</h3>
          <div className="space-y-4">
            {order.items?.map((item: any, index: number) => (
              <div
                key={index}
                className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                {/* Product Image - Small Thumbnail */}
                {item.product?.images && item.product.images[0] ? (
                  <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1 hover:text-primary-500 transition-colors">
                        {item.product?.title || 'Product'}
                      </h4>
                      {item.product?.category && (
                        <p className="text-white/60 text-sm capitalize mb-1">{item.product.category}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-white/70 text-sm">
                          Quantity: <span className="text-primary-400 font-medium">{item.quantity}</span>
                        </span>
                        <span className="text-white/70 text-sm">
                          Unit Price: <span className="text-primary-400 font-medium">৳{item.price}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary-500 font-bold text-lg">
                        ৳{(item.quantity * item.price).toFixed(2)}
                      </p>
                      {item.product?.discountPrice && item.product.discountPrice < item.product.price && (
                        <p className="text-white/50 text-sm line-through mt-1">
                          ৳{(item.quantity * item.product.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payment & Shipping Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Payment Method:</span>
                <span className="text-primary-400 font-medium capitalize">{order.paymentMethod?.replace('-', ' ') || 'Cash on Delivery'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Payment Status:</span>
                <span className={`font-semibold ${
                  order.paymentStatus === 'paid'
                    ? 'text-green-400'
                    : order.paymentStatus === 'failed'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}>
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Pending'}
                </span>
              </div>
              {order.seller?.email && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-white/70 text-sm mb-1">Seller Contact:</p>
                  <p className="text-primary-400 text-sm">{order.seller.email}</p>
                  {order.seller.phone && (
                    <p className="text-primary-400 text-sm">{order.seller.phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Shipping Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/70 text-sm mb-2">Delivery Address:</p>
                <p className="text-white/90 leading-relaxed">{order.shippingAddress}</p>
              </div>
              <div className="pt-3 border-t border-white/10">
                <p className="text-white/70 text-sm mb-1">Delivery Method:</p>
                <p className="text-primary-400 font-medium">Standard Delivery</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Estimated Delivery:</p>
                <p className="text-primary-400 font-medium">{estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold text-white">Total Amount:</span>
            <span className="text-3xl font-bold text-primary-500">৳{order.totalAmount}</span>
          </div>
          {order.paymentMethod === 'cash-on-delivery' && (
            <p className="text-white/60 text-sm mt-2">You&apos;ll pay this amount when the product is delivered</p>
          )}
        </div>

        {order.status === 'completed' && !data?.data?.review && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Leave a Review</h2>
            <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Rating</label>
                <select
                  {...register('rating', { valueAsNumber: true })}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value={1} className="bg-dark-900">1 - Poor</option>
                  <option value={2} className="bg-dark-900">2 - Fair</option>
                  <option value={3} className="bg-dark-900">3 - Good</option>
                  <option value={4} className="bg-dark-900">4 - Very Good</option>
                  <option value={5} className="bg-dark-900">5 - Excellent</option>
                </select>
                {errors.rating && (
                  <p className="mt-2 text-sm text-red-400">{errors.rating.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Comment (Optional)</label>
                <textarea
                  {...register('comment')}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Share your experience..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all font-semibold text-lg shadow-lg shadow-primary-500/30"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {data?.data?.review && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Your Review</h2>
            <p className="text-primary-500 font-semibold text-lg mb-2">Rating: {data.data.review.rating}/5</p>
            {data.data.review.comment && <p className="text-white/80">{data.data.review.comment}</p>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

