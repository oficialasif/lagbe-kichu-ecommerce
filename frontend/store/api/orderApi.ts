import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Cookies from 'js-cookie'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  credentials: 'include',
  // Add timeout to prevent hanging requests (30 seconds)
  timeout: 30000,
  prepareHeaders: (headers) => {
    const token = Cookies.get('accessToken')
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery,
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order'],
    }),
    getBuyerOrders: builder.query({
      query: (params) => ({
        url: '/buyer/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    getOrderDetails: builder.query({
      query: (id) => `/buyer/orders/${id}`,
      providesTags: ['Order'],
    }),
    getSellerOrders: builder.query({
      query: (params) => ({
        url: '/seller/orders',
        params,
      }),
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/seller/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order'],
    }),
    createReview: builder.mutation({
      query: ({ orderId, reviewData }) => ({
        url: `/buyer/orders/${orderId}/review`,
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Order'],
    }),
  }),
})

export const {
  useCreateOrderMutation,
  useGetBuyerOrdersQuery,
  useGetOrderDetailsQuery,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useCreateReviewMutation,
} = orderApi

