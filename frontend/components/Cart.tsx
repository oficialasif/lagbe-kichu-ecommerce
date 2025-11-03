'use client'

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart, updateQuantity, clearCart, toggleItemSelection, selectAllItems, deselectAllItems } from '@/store/slices/cartSlice'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { showToast } from './Toast'
import { useRouter } from 'next/navigation'

export default function Cart() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { items, selectedItems } = useAppSelector((state) => state.cart)
  const [isOpen, setIsOpen] = useState(false)

  // Calculate totals for selected items only
  const selectedItemsData = items.filter((item) => 
    selectedItems.includes(item.product._id)
  )

  const total = selectedItemsData.reduce(
    (sum, item) =>
      sum + (item.product.discountPrice || item.product.price) * item.quantity,
    0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const selectedCount = selectedItemsData.reduce((sum, item) => sum + item.quantity, 0)

  // Auto-select all items when cart opens (if nothing selected)
  useEffect(() => {
    if (isOpen && items.length > 0 && selectedItems.length === 0) {
      dispatch(selectAllItems())
    }
  }, [isOpen, items.length, selectedItems.length, dispatch])

  // Handle escape key to close cart
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when cart is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Cart Icon Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className="relative p-2 text-white hover:text-primary-500 transition-colors z-10"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* Cart Sidebar - Rendered via Portal */}
      {typeof window !== 'undefined' && isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-dark-900/95 backdrop-blur-md border-l border-white/20 z-[100] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'fixed',
              top: '0',
              right: '0',
              height: '100vh',
              width: '100%',
              maxWidth: '28rem'
            }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60 mb-4">Your cart is empty</p>
                  <Link
                    href="/buyer/products"
                    className="text-primary-500 hover:text-primary-400 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <>
                  {/* Select All / Deselect All */}
                  <div className="mb-4 pb-4 border-b border-white/20 flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === items.length && items.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            dispatch(selectAllItems())
                          } else {
                            dispatch(deselectAllItems())
                          }
                        }}
                        className="w-4 h-4 text-primary-500 border-white/20 bg-white/10 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <span className="ml-2 text-white/80 text-sm">
                        {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
                      </span>
                    </label>
                    <span className="text-white/60 text-sm">
                      {selectedItems.length} of {items.length} selected
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => {
                      const isSelected = selectedItems.includes(item.product._id)
                      const itemPrice = item.product.discountPrice || item.product.price
                      const itemTotal = itemPrice * item.quantity
                      return (
                        <div
                          key={item.product._id}
                          className={`bg-white/10 backdrop-blur-sm border rounded-lg p-4 transition-all ${
                            isSelected
                              ? 'border-primary-500/50 bg-primary-500/10'
                              : 'border-white/20'
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Selection Checkbox */}
                            <div className="flex items-start pt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => dispatch(toggleItemSelection(item.product._id))}
                                className="w-5 h-5 text-primary-500 border-white/20 bg-white/10 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                              />
                            </div>

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
                              <h3 className="text-white font-medium mb-1 truncate">
                                {item.product.title}
                              </h3>
                              <p className="text-white/60 text-sm mb-2">
                                {item.product.seller.name}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        updateQuantity({
                                          productId: item.product._id,
                                          quantity: item.quantity - 1,
                                        })
                                      )
                                    }
                                    className="w-7 h-7 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="text-white w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        updateQuantity({
                                          productId: item.product._id,
                                          quantity: item.quantity + 1,
                                        })
                                      )
                                    }
                                    disabled={item.quantity >= item.product.stock}
                                    className="w-7 h-7 rounded bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-primary-500 font-semibold">
                                    ৳{itemTotal.toFixed(2)}
                                  </p>
                                  {item.product.discountPrice && (
                                    <p className="text-white/40 text-xs line-through">
                                      ৳{(item.product.price * item.quantity).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  dispatch(removeFromCart(item.product._id))
                                  showToast('Item removed from cart', 'info')
                                }}
                                className="mt-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-white/20 pt-4 mb-4">
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Selected Items:</span>
                        <span className="text-white font-medium">{selectedCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Subtotal:</span>
                        <span className="text-2xl font-bold text-primary-500">
                          ৳{total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {selectedItems.length > 0 ? (
                      <button
                        onClick={() => {
                          // Store selected items in sessionStorage to pass to checkout
                          const selectedProducts = items
                            .filter((item) => selectedItems.includes(item.product._id))
                            .map((item) => ({
                              product: item.product._id,
                              quantity: item.quantity,
                            }))
                          sessionStorage.setItem('selectedCartItems', JSON.stringify(selectedProducts))
                          setIsOpen(false)
                          router.push('/buyer/checkout')
                        }}
                        className="block w-full px-6 py-3 bg-primary-500 text-white text-center rounded-lg hover:bg-primary-600 transition-all font-semibold flex items-center justify-center gap-2 group hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30"
                      >
                        <span>Order Selected ({selectedCount} items)</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="block w-full px-6 py-3 bg-white/10 text-white/40 text-center rounded-lg cursor-not-allowed font-semibold"
                      >
                        Select items to order
                      </button>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          dispatch(clearCart())
                          showToast('Cart cleared', 'info')
                        }}
                        className="flex-1 px-4 py-2 text-white/60 hover:text-white transition-colors text-sm border border-white/20 rounded-lg hover:border-white/40"
                      >
                        Clear All
                      </button>
                      {selectedItems.length > 0 && (
                        <button
                          onClick={() => {
                            dispatch(deselectAllItems())
                          }}
                          className="flex-1 px-4 py-2 text-white/60 hover:text-white transition-colors text-sm border border-white/20 rounded-lg hover:border-white/40"
                        >
                          Deselect All
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

