'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetProductByIdQuery } from '@/store/api/productApi'
import { addToCart } from '@/store/slices/cartSlice'
import { showToast } from '@/components/Toast'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const { data, isLoading } = useGetProductByIdQuery(id as string)

  const product = data?.data?.product

  const isDiscountValid = () => {
    if (!product?.discountPrice || product.discountPrice >= product.price) {
      return false
    }
    if (!product.discountEndDate) {
      return true
    }
    return new Date(product.discountEndDate) > new Date()
  }

  const hasValidDiscount = isDiscountValid()
  const displayPrice = hasValidDiscount && product?.discountPrice ? product.discountPrice : product?.price

  const handleAddToCart = () => {
    if (!isAuthenticated || user?.role !== 'buyer') {
      router.push('/auth/login')
      return
    }

    if (!product || product.stock === 0) {
      showToast('Product is out of stock', 'error')
      return
    }

    if (quantity > product.stock) {
      showToast(`Only ${product.stock} items available`, 'error')
      return
    }

    dispatch(
      addToCart({
        product: {
          _id: product._id,
          title: product.title,
          price: product.price,
          discountPrice: hasValidDiscount ? product.discountPrice : undefined,
          images: product.images || [],
          seller: {
            _id: product.seller?._id || '',
            name: product.seller?.name || 'Unknown',
          },
          stock: product.stock,
        },
        quantity,
      })
    )
    showToast(`${quantity} ${quantity === 1 ? 'item' : 'items'} added to cart!`, 'success')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-12 relative z-10">
          <p className="text-white/70 text-center py-12">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 pt-32 pb-12 relative z-10">
          <p className="text-white/70 text-center py-12">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-12 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/buyer/products' },
            { label: product.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images - Smaller and Organized */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mb-4">
              {product.images && product.images[selectedImage] && (
                <div className="aspect-square max-w-md mx-auto mb-4">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              )}
              
              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 justify-center flex-wrap mt-4">
                  {product.images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                        selectedImage === index
                          ? 'border-primary-500'
                          : 'border-white/20 hover:border-primary-500/50'
                      }`}
                    >
                      <img src={img} alt={`${product.title} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Section */}
            {product.video && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Product Video</h3>
                <div className="aspect-video">
                  <video src={product.video} controls className="w-full h-full rounded-lg" />
                </div>
              </div>
            )}
          </div>

          {/* Product Info & Order Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 sticky top-24">
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full capitalize">
                    {product.category}
                  </span>
                  {product.isHotCollection && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-semibold border border-red-500/30">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      HOT COLLECTION
                    </span>
                  )}
                  {product.brand && (
                    <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                      {product.brand}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">{product.title}</h1>
              </div>

              {/* Price Section */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-primary-500">৳{displayPrice}</span>
                  {hasValidDiscount && (
                    <>
                      <span className="text-xl text-white/50 line-through">
                        ৳{product.price}
                      </span>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Save ৳{(product.price - product.discountPrice).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                {hasValidDiscount && product.discountEndDate && (
                  <div className="text-sm text-primary-400 font-medium mt-2">
                    Discount ends: {new Date(product.discountEndDate).toLocaleDateString()}
                  </div>
                )}
                {product.stock !== undefined && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock > 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </div>

              {/* Seller Info & Rating */}
              <div className="mb-6 space-y-3">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white/70 text-sm mb-1">Sold by</p>
                  <p className="text-primary-500 font-semibold">{product.seller?.name || 'N/A'}</p>
                </div>
                {data?.data?.reviews && data.data.reviews.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/70 text-sm mb-2">Customer Rating</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => {
                          const avgRating = data.data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.data.reviews.length
                          return (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(avgRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-white/20'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )
                        })}
                      </div>
                      <span className="text-white font-semibold">
                        {((data.data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.data.reviews.length).toFixed(1))}
                      </span>
                      <span className="text-white/60 text-sm">
                        ({data.data.reviews.length} {data.data.reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="mb-6 space-y-4">
                {/* Brand */}
                {product.brand && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/70 text-xs mb-1">Brand</p>
                    <p className="text-primary-400 font-semibold">{product.brand}</p>
                  </div>
                )}

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/70 text-xs mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feature: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/70 text-xs mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(product.weight || product.dimensions || product.warranty) && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white/70 text-xs mb-2">Product Specifications</p>
                    <div className="space-y-1 text-sm">
                      {product.weight && (
                        <p className="text-white/80">
                          <span className="text-white/60">Weight:</span> {product.weight} kg
                        </p>
                      )}
                      {product.dimensions && (
                        <p className="text-white/80">
                          <span className="text-white/60">Dimensions:</span> {product.dimensions}
                        </p>
                      )}
                      {product.warranty && (
                        <p className="text-white/80">
                          <span className="text-white/60">Warranty:</span> {product.warranty}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Description</h3>
                  <p className="text-white/80 leading-relaxed text-sm">{product.description}</p>
                </div>
              </div>
            
              {isAuthenticated && user?.role === 'buyer' && (
                <div className="border-t border-white/20 pt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-white/80">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0 || quantity > product.stock}
                    className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-semibold text-lg shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group hover:scale-105 active:scale-95 disabled:hover:scale-100"
                  >
                    {product.stock === 0 ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Out of Stock</span>
                      </>
                    ) : quantity > product.stock ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Not enough stock</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                  <p className="text-white/60 text-xs mt-3 text-center">
                    Total: <span className="text-primary-400 font-semibold">
                      ৳{((product.discountPrice || product.price) * quantity).toFixed(2)}
                    </span>
                  </p>
                  {product.discountPrice && product.discountPrice < product.price && (
                    <p className="text-white/40 text-xs mt-1 text-center line-through">
                      ৳{(product.price * quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {data?.data?.reviews && data.data.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Customer Reviews</h2>
            <div className="space-y-4">
              {data.data.reviews.map((review: any) => (
                <div
                  key={review._id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {review.buyer?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{review.buyer?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-white/20'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-white/60 text-xs">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-white/80 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

