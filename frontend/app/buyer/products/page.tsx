'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetProductsQuery, useSearchProductsQuery, useGetAllCategoriesQuery } from '@/store/api/productApi'
import { addToCart } from '@/store/slices/cartSlice'
import { showToast } from '@/components/Toast'
import Link from 'next/link'

const isDiscountValid = (product: any) => {
  if (!product?.discountPrice || product.discountPrice >= product.price) {
    return false
  }
  if (!product.discountEndDate) {
    return true
  }
  return new Date(product.discountEndDate) > new Date()
}

export default function BuyerProductsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<'popular' | 'rating' | 'price'>('popular')
  
  const { data, isLoading } = useGetProductsQuery({
    page,
    limit: 12,
    ...(category && { category }),
  })

  const { data: searchData } = useSearchProductsQuery(searchQuery, {
    skip: !searchQuery || searchQuery.length < 2,
  })

  const { data: categoriesData } = useGetAllCategoriesQuery(undefined)

  const displayData = searchQuery && searchData ? searchData : data

  const sortedProducts = displayData?.data?.products ? [...displayData.data.products] : []
  if (sortedProducts.length > 0) {
    if (filter === 'rating') {
      sortedProducts.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    } else if (filter === 'price') {
      sortedProducts.sort((a: any, b: any) => {
        const priceA = isDiscountValid(a) && a.discountPrice ? a.discountPrice : a.price
        const priceB = isDiscountValid(b) && b.discountPrice ? b.discountPrice : b.price
        return priceA - priceB
      })
    }
  }

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated || user?.role !== 'buyer') {
      showToast('Please login to add items to cart', 'info')
      router.push('/auth/login')
      return
    }

    if (!product || product.stock === 0) {
      showToast('Product is out of stock', 'error')
      return
    }

    dispatch(
      addToCart({
        product: {
          _id: product._id,
          title: product.title,
          price: product.price,
          discountPrice: isDiscountValid(product) ? product.discountPrice : undefined,
          images: product.images || [],
          seller: {
            _id: product.seller?._id || '',
            name: product.seller?.name || 'Unknown',
          },
          stock: product.stock,
        },
        quantity: 1,
      })
    )
    showToast('1 item added to cart!', 'success')
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-12 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products' },
            ]}
          />
          
          {/* Main Container with Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg mt-6 p-6 lg:p-8">
            {/* Top Section - Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 border border-white/20 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => {
                    if (searchQuery) {
                      // Trigger search
                    }
                  }}
                >
                  <svg className="h-5 w-5 text-white/50 hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Sidebar - Categories & Filters */}
              <aside className="lg:w-64 flex-shrink-0">
                <div className="space-y-8">
                  {/* Categories Section */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
                    <ul className="space-y-2">
                      <li>
                        <button
                          onClick={() => setCategory('')}
                          className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                            category === ''
                              ? 'bg-primary-500/20 text-primary-400 font-medium border border-primary-500/30'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          All Categories
                        </button>
                      </li>
                      {categoriesData?.data?.categories
                        ?.filter((cat: any) => cat.isActive)
                        .map((cat: any) => (
                          <li key={cat._id}>
                            <button
                              onClick={() => setCategory(cat.name.toLowerCase())}
                              className={`w-full text-left py-2 px-3 rounded-md transition-colors ${
                                category === cat.name.toLowerCase()
                                  ? 'bg-primary-500/20 text-primary-400 font-medium border border-primary-500/30'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {cat.name}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Filter Section */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-4">Filter</h2>
                    <div className="space-y-3">
                      {(['popular', 'rating', 'price'] as const).map((filterOption) => (
                        <label key={filterOption} className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="filter"
                            value={filterOption}
                            checked={filter === filterOption}
                            onChange={() => setFilter(filterOption)}
                            className="w-4 h-4 text-primary-500 border-white/20 bg-white/10 focus:ring-primary-500 focus:ring-2"
                          />
                          <span className="ml-3 text-white/70 capitalize group-hover:text-white transition-colors">
                            {filterOption}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content Area - Products */}
              <main className="flex-1">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-white/70">Loading products...</p>
                  </div>
                ) : sortedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProducts.map((product: any) => (
                      <Link
                        key={product._id}
                        href={`/buyer/products/${product._id}`}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all group"
                      >
                        {/* Product Image */}
                        {product.images && product.images[0] && (
                          <div className="w-full h-48 bg-white/5 overflow-hidden relative">
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.isHotCollection && (
                              <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                HOT
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Product Info */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/60 capitalize">{product.category}</span>
                            {product.brand && (
                              <span className="text-xs text-primary-400 font-medium">{product.brand}</span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                            {product.title}
                          </h3>
                          
                          {/* Features */}
                          {product.features && product.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.features.slice(0, 2).map((feature: string, idx: number) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Price and Stock */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              {isDiscountValid(product) ? (
                                <>
                                  <p className="text-lg font-bold text-primary-500">
                                    ৳{product.discountPrice}
                                  </p>
                                  <p className="text-sm text-white/50 line-through">
                                    ৳{product.price}
                                  </p>
                                </>
                              ) : (
                                <p className="text-lg font-bold text-primary-500">
                                  ৳{product.price}
                                </p>
                              )}
                            </div>
                            {product.stock !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                product.stock > 0 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {product.stock > 0 ? 'In Stock' : 'Out'}
                              </span>
                            )}
                          </div>
                          
                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock === 0}
                            className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all ${
                              product.stock > 0
                                ? 'bg-primary-500 hover:bg-primary-600 text-white active:scale-95'
                                : 'bg-white/10 text-white/50 cursor-not-allowed'
                            }`}
                          >
                            {product.stock > 0 ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Add to Cart
                              </span>
                            ) : (
                              'Out of Stock'
                            )}
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/70">No products found</p>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
