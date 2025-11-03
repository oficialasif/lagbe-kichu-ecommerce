'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import { useGetSellerProductsQuery, useUpdateProductMutation, useGetAllCategoriesQuery, useCreateCategoryMutation } from '@/store/api/sellerApi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { showToast } from '@/components/Toast'

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  discountPrice: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive().optional()
  ),
  discountEndDate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().optional()
  ),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  features: z.string().optional(),
  isHotCollection: z.boolean().optional(),
  tags: z.string().optional(),
  brand: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  warranty: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

// Categories that require weight, dimensions, and warranty fields
const TECHNICAL_CATEGORIES = [
  'smartphone',
  'electronics',
  'electronic devices',
  'laptop',
  'computer',
  'tablet',
  'phone',
  'smartphone',
  'mobile phone',
  'tv',
  'television',
  'camera',
  'appliance',
  'home appliance',
  'electrical',
  'gadget',
  'device',
]

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [images, setImages] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [currentFeatures, setCurrentFeatures] = useState<string[]>([])
  const [featureInput, setFeatureInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const { data, isLoading: isLoadingProduct } = useGetSellerProductsQuery({ page: 1, limit: 100 })
  const { data: categoriesData } = useGetAllCategoriesQuery(undefined)
  const [updateProduct, { isLoading }] = useUpdateProductMutation()
  const [createCategory] = useCreateCategoryMutation()

  const showTechnicalFields = selectedCategory
    ? TECHNICAL_CATEGORIES.some((cat) => selectedCategory.toLowerCase().includes(cat.toLowerCase()))
    : false

  const product = data?.data?.products?.find((p: any) => p._id === id)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    values: product ? {
      title: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      discountPrice: product.discountPrice,
      discountEndDate: product.discountEndDate 
        ? new Date(product.discountEndDate).toISOString().slice(0, 16)
        : undefined,
      stock: product.stock,
    } : undefined,
  })

  const watchedCategory = watch('category')
  
  useEffect(() => {
    if (watchedCategory) {
      setSelectedCategory(watchedCategory)
    }
  }, [watchedCategory])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (product) {
      setCurrentFeatures(product.features || [])
      setSelectedCategory(product.category || '')
      reset({
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price,
        discountPrice: product.discountPrice,
        discountEndDate: product.discountEndDate 
          ? new Date(product.discountEndDate).toISOString().slice(0, 16)
          : undefined,
        stock: product.stock,
        isHotCollection: product.isHotCollection || false,
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags || '',
        brand: product.brand || '',
        weight: product.weight || undefined,
        dimensions: product.dimensions || '',
        warranty: product.warranty || '',
      })
    }
  }, [product, reset])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0])
    }
  }

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setCurrentFeatures([...currentFeatures, featureInput.trim()])
      setFeatureInput('')
    }
  }

  const handleRemoveFeature = (index: number) => {
    setCurrentFeatures(currentFeatures.filter((_, i) => i !== index))
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Category name is required', 'error')
      return
    }
    try {
      await createCategory({ name: newCategoryName.trim(), isActive: true }).unwrap()
      showToast('Category created successfully', 'success')
      setNewCategoryName('')
      setShowNewCategoryInput(false)
    } catch (error: any) {
      showToast(error?.data?.message || 'Failed to create category', 'error')
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      const formData = new FormData()
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'isHotCollection') {
            formData.append(key, value ? 'true' : 'false')
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      // Add features
      if (currentFeatures.length > 0) {
        formData.append('features', currentFeatures.join(','))
      }

      if (images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image)
        })
      }

      if (video) {
        formData.append('video', video)
      }

      await updateProduct({ id: id as string, formData }).unwrap()
      showToast('Product updated successfully!', 'success')
      router.push('/seller/products')
    } catch (error: any) {
      showToast(error?.data?.message || 'Failed to update product', 'error')
    }
  }

  if (!isAuthenticated || user?.role !== 'seller') {
    return null
  }

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
          <p className="text-white/70 text-center py-12">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
        <Navbar />
        <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
          <p className="text-white/70 text-center py-12">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Seller Dashboard', href: '/seller/dashboard' },
            { label: 'Products', href: '/seller/products' },
            { label: product?.title || 'Edit Product' },
          ]}
        />
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Edit Product</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Title</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter product title"
            />
            {errors.title && (
              <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              placeholder="Enter product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Category</label>
            <div className="flex gap-2 mb-2">
              <select
                {...register('category')}
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="" className="bg-dark-900">Select a category</option>
                {categoriesData?.data?.categories?.filter((c: any) => c.isActive).map((category: any) => (
                  <option key={category._id} value={category.name} className="bg-dark-900">
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-medium"
              >
                {showNewCategoryInput ? 'Cancel' : '+ New'}
              </button>
            </div>
            {showNewCategoryInput && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter new category name"
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium"
                >
                  Create
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-white/80">Price</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-white/80">Discount Price <span className="text-white/50 text-xs">(Optional)</span></label>
              <input
                {...register('discountPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-white/80">Stock</label>
              <input
                {...register('stock', { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-white/80">Discount End Date <span className="text-white/50 text-xs">(Optional)</span></label>
              <input
                {...register('discountEndDate')}
                type="datetime-local"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Additional Images (Optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Preview Video (Optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600"
            />
          </div>

          {/* Features Section */}
          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Product Features <span className="text-white/50 text-xs">(Optional)</span></label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                placeholder="Enter a feature (e.g., Waterproof, Fast Charging)"
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-medium"
              >
                Add
              </button>
            </div>
            {currentFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {currentFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hot Collection & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 mb-3 text-white/80">
                <input
                  type="checkbox"
                  {...register('isHotCollection')}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="font-medium">Hot Collection</span>
              </label>
              <p className="text-white/60 text-xs">Mark as featured hot collection item</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3 text-white/80">Tags <span className="text-white/50 text-xs">(Optional - Comma separated)</span></label>
              <input
                {...register('tags')}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="e.g., popular, trending, bestseller"
              />
              <p className="text-white/60 text-xs mt-1">Separate tags with commas</p>
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium mb-3 text-white/80">Brand</label>
            <input
              {...register('brand')}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter brand name"
            />
          </div>

          {/* Weight, Dimensions, Warranty - Only for technical categories */}
          {showTechnicalFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Weight (kg) <span className="text-white/50 text-xs">(Optional)</span></label>
                <input
                  {...register('weight', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Dimensions <span className="text-white/50 text-xs">(Optional)</span></label>
                <input
                  {...register('dimensions')}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g., 10x20x5 cm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Warranty <span className="text-white/50 text-xs">(Optional)</span></label>
                <input
                  {...register('warranty')}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g., 1 Year Warranty"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all font-semibold text-lg shadow-lg shadow-primary-500/30"
          >
            {isLoading ? 'Updating...' : 'Update Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

