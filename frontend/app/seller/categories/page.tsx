'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import Navbar from '@/components/Navbar'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/store/api/sellerApi'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showToast } from '@/components/Toast'

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function CategoriesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const { data, isLoading } = useGetCategoriesQuery(undefined)
  const [createCategory] = useCreateCategoryMutation()
  const [updateCategory] = useUpdateCategoryMutation()
  const [deleteCategory] = useDeleteCategoryMutation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/auth/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'seller') {
    return null
  }

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingId) {
        await updateCategory({ id: editingId, ...data }).unwrap()
        showToast('Category updated successfully', 'success')
      } else {
        await createCategory(data).unwrap()
        showToast('Category created successfully', 'success')
      }
      reset()
      setEditingId(null)
      setShowForm(false)
    } catch (error: any) {
      showToast(error?.data?.message || 'Failed to save category', 'error')
    }
  }

  const handleEdit = (category: any) => {
    setEditingId(category._id)
    setValue('name', category.name)
    setValue('description', category.description || '')
    setValue('isActive', category.isActive)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? Products using this category will not be deleted.')) {
      try {
        await deleteCategory(id).unwrap()
        showToast('Category deleted successfully', 'success')
      } catch (error: any) {
        showToast(error?.data?.message || 'Failed to delete category', 'error')
      }
    }
  }

  const handleCancel = () => {
    reset()
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      <Navbar />
      <div className="container mx-auto px-6 py-12 pt-32 relative z-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Seller Dashboard', href: '/seller/dashboard' },
            { label: 'Categories' },
          ]}
        />
        <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Manage Categories</h1>
          </div>
          <button
            onClick={() => {
              reset()
              setEditingId(null)
              setShowForm(!showForm)
            }}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-semibold shadow-lg shadow-primary-500/30 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'Create Category'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Category Name *</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Enter category name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-white/80">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <label className="text-white/80">Active</label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-semibold shadow-lg shadow-primary-500/30"
                >
                  {editingId ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all font-semibold border border-white/20"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-white/70 text-center py-12">Loading categories...</p>
        ) : data?.data?.categories && data.data.categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.categories.map((category: any) => (
              <div
                key={category._id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{category.name}</h3>
                    <p className="text-white/60 text-sm">{category.slug}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    category.isActive
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {category.description && (
                  <p className="text-white/70 text-sm mb-4">{category.description}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/70 mb-4">No categories found</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all font-semibold"
            >
              Create Your First Category
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

