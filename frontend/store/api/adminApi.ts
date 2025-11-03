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

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['User', 'AdminStats'],
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    banUser: builder.mutation({
      query: ({ userId, isBanned }) => ({
        url: `/admin/users/${userId}/ban`,
        method: 'PATCH',
        body: { isBanned },
      }),
      invalidatesTags: ['User'],
    }),
    getAdminDashboard: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['AdminStats'],
    }),
  }),
})

export const {
  useGetAllUsersQuery,
  useBanUserMutation,
  useGetAdminDashboardQuery,
} = adminApi

