import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = Cookies.get('accessToken')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const sellerApi = createApi({
  reducerPath: 'sellerApi',
  baseQuery,
  tagTypes: ['SellerStats', 'SellerProduct', 'SellerOrder', 'Category'],
  endpoints: (builder) => ({
    // Categories
    getCategories: builder.query({
      query: () => '/categories/seller',
      providesTags: ['Category'],
    }),
    getAllCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (categoryData) => ({
        url: '/categories',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...categoryData }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body: categoryData,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    getSellerDashboard: builder.query({
      query: () => '/seller/dashboard',
      providesTags: ['SellerStats'],
    }),
    getSellerProducts: builder.query({
      query: (params) => ({
        url: '/seller/products',
        params,
      }),
      providesTags: ['SellerProduct'],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: '/seller/products',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['SellerProduct', 'SellerStats'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/seller/products/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['SellerProduct'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/seller/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SellerProduct', 'SellerStats'],
    }),
    getSellerOrders: builder.query({
      query: (params) => ({
        url: '/seller/orders',
        params,
      }),
      providesTags: ['SellerOrder'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/seller/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['SellerOrder', 'SellerStats'],
    }),
  }),
})

export const {
  useGetSellerDashboardQuery,
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = sellerApi

