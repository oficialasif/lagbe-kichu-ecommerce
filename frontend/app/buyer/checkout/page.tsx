'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateOrderMutation } from '@/store/api/orderApi'
import { removeFromCart } from '@/store/slices/cartSlice'
import { showToast } from '@/components/Toast'

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, 'Shipping address must be at least 10 characters'),
  paymentMethod: z.enum(['cash-on-delivery', 'bkash']),
  bkashNumber: z.string().optional(),
  bkashTransactionId: z.string().optional(),
}).refine((data) => {
  if (data.paymentMethod === 'bkash') {
    return data.bkashNumber && data.bkashNumber.length >= 10;
  }
  return true;
}, {
  message: 'Bkash number is required (minimum 10 digits)',
  path: ['bkashNumber'],
}).refine((data) => {
  if (data.paymentMethod === 'bkash') {
    return data.bkashTransactionId && data.bkashTransactionId.length > 0;
  }
  return true;
}, {
  message: 'Transaction ID is required',
  path: ['bkashTransactionId'],
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const { items } = useAppSelector((state) => state.cart)
  const [createOrder, { isLoading }] = useCreateOrderMutation()
  const [paymentMethod, setPaymentMethod] = useState<'cash-on-delivery' | 'bkash'>('cash-on-delivery')
  const [checkoutItems, setCheckoutItems] = useState<typeof items>([])
  const hasLoadedItems = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'cash-on-delivery',
    },
  })

  const selectedPaymentMethod = watch('paymentMethod')

  useEffect(() => {
    if (hasLoadedItems.current) {
      return
    }

    if (!isAuthenticated || user?.role !== 'buyer') {
      router.push('/auth/login')
      return
    }
    
    if (items.length === 0) {
      router.push('/buyer/products')
      return
    }

    const selectedCartItems = sessionStorage.getItem('selectedCartItems')
    
    if (selectedCartItems && selectedCartItems !== 'null' && selectedCartItems !== '[]') {
      try {
        const selectedProducts = JSON.parse(selectedCartItems)
        
        if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
          const selectedProductIds = new Set(selectedProducts.map((sp: any) => String(sp.product)))
          const filteredItems = items.filter((item) => 
            selectedProductIds.has(String(item.product._id))
          )
          
          if (filteredItems.length > 0) {
            setCheckoutItems(filteredItems)
            hasLoadedItems.current = true
            sessionStorage.removeItem('selectedCartItems')
            return
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error parsing selected items:', error)
        }
      }
    }
    
    setCheckoutItems(items)
    hasLoadedItems.current = true
  }, [isAuthenticated, user, items.length, router])

  if (!isAuthenticated || user?.role !== 'buyer' || items.length === 0) {
    return null
  }

  if (checkoutItems.length === 0 && items.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-white/70">Loading checkout...</p>
      </div>
    )
  }

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  )

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const orderItems = checkoutItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }))
      const result = await createOrder({
        items: orderItems,
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
      }).unwrap()

      if (result.success && result.data?.order?._id) {
        // Remove only ordered items from cart (not all items)
        checkoutItems.forEach((item) => {
          dispatch(removeFromCart(item.product._id))
        })
        // Show success message
        showToast('Order placed successfully! Redirecting...', 'success')
        // Redirect immediately to prevent loading state issues
        router.push(`/buyer/orders/${result.data.order._id}`)
      } else {
        showToast('Order placed but received unexpected response', 'error')
      }
    } catch (error: any) {
      showToast(error?.data?.message || 'Failed to create order', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-12 flex-1 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/buyer/products' },
            { label: 'Checkout' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Shipping Address</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="shippingAddress" className="block text-sm font-medium text-white/80 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    {...register('shippingAddress')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Enter your complete delivery address"
                  />
                  {errors.shippingAddress && (
                    <p className="mt-2 text-sm text-red-400">{errors.shippingAddress.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4">Payment Method *</label>
                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value="cash-on-delivery"
                        className="mt-1 w-5 h-5 text-primary-500 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold">Cash on Delivery</span>
                        </div>
                        <p className="text-white/60 text-sm">Pay with cash when you receive your order</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        {...register('paymentMethod')}
                        type="radio"
                        value="bkash"
                        className="mt-1 w-5 h-5 text-primary-500 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold">Bkash (Sandbox)</span>
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded">Test Mode</span>
                        </div>
                        <p className="text-white/60 text-sm mb-4">Pay securely with Bkash</p>
                        {selectedPaymentMethod === 'bkash' && (
                          <div className="space-y-4 mt-4">
                            <div>
                              <label htmlFor="bkashNumber" className="block text-sm font-medium text-white/80 mb-2">
                                Bkash Number *
                              </label>
                              <input
                                {...register('bkashNumber')}
                                type="tel"
                                placeholder="01XXXXXXXXX"
                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                              {errors.bkashNumber && (
                                <p className="mt-2 text-sm text-red-400">{errors.bkashNumber.message}</p>
                              )}
                            </div>
                            <div>
                              <label htmlFor="bkashTransactionId" className="block text-sm font-medium text-white/80 mb-2">
                                Transaction ID *
                              </label>
                              <input
                                {...register('bkashTransactionId')}
                                type="text"
                                placeholder="Enter transaction ID"
                                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                              />
                              {errors.bkashTransactionId && (
                                <p className="mt-2 text-sm text-red-400">{errors.bkashTransactionId.message}</p>
                              )}
                              <p className="mt-2 text-xs text-white/50">
                                For testing, use any transaction ID format
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  {errors.paymentMethod && (
                    <p className="mt-2 text-sm text-red-400">{errors.paymentMethod.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all font-semibold text-lg shadow-lg shadow-primary-500/30 flex items-center justify-center gap-3 group"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 sticky top-32">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {checkoutItems.length === 0 ? (
                  <p className="text-white/60 text-center py-4">No items selected</p>
                ) : (
                  checkoutItems.map((item) => {
                  const itemPrice = item.product.discountPrice || item.product.price
                  const itemTotal = itemPrice * item.quantity
                  return (
                    <div key={item.product._id} className="flex gap-4">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {item.product.images[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.title}
                            fill
                            className="object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium mb-1 truncate">{item.product.title}</h3>
                        <p className="text-white/60 text-sm mb-1">Qty: {item.quantity}</p>
                        <p className="text-primary-500 font-semibold">৳{itemTotal.toFixed(2)}</p>
                        {item.product.discountPrice && (
                          <p className="text-white/40 text-xs line-through">
                            ৳{(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                  })
                )}
              </div>

              <div className="border-t border-white/20 pt-4 space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Subtotal:</span>
                  <span className="text-white font-semibold">৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Shipping:</span>
                  <span className="text-white font-semibold">Free</span>
                </div>
                <div className="border-t border-white/20 pt-3 flex justify-between">
                  <span className="text-xl font-bold text-white">Total:</span>
                  <span className="text-2xl font-bold text-primary-500">৳{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

