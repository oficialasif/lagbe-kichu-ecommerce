'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetSellerProductsQuery, useDeleteProductMutation } from '@/store/api/sellerApi'
import Link from 'next/link'

export default function SellerProductsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetSellerProductsQuery({ page, limit: 10 })
  const [deleteProduct] = useDeleteProductMutation()

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId).unwrap()
      } catch (error) {
        alert('Failed to delete product')
      }
    }
  }

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
            { label: 'Seller Dashboard', href: '/seller/dashboard' },
            { label: 'Products' },
          ]}
        />
        <div className="mb-8 flex justify-end items-center gap-4">
          <Link
            href="/seller/products/new"
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-semibold shadow-lg shadow-primary-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">My Products</h1>
        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading products...</p>
        ) : data?.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.products.map((product: any) => (
              <div key={product._id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden group hover:bg-white/15 transition-all">
                {product.images && product.images[0] && (
                  <div className="w-full h-48 overflow-hidden bg-white/5">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-primary-500 transition-colors">{product.title}</h3>
                  <p className="text-white/60 text-sm mb-3 capitalize">{product.category}</p>
                  <p className="text-xl font-bold text-primary-500 mb-6">
                    ৳{product.price}
                    {product.discountPrice && (
                      <span className="ml-2 text-sm text-white/50 line-through">
                        ৳{product.discountPrice}
                      </span>
                    )}
                  </p>
                  <div className="flex space-x-3">
                    <Link
                      href={`/seller/products/${product._id}/edit`}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/70 text-center py-12">No products found</p>
        )}
      </div>
    </div>
  )
}

