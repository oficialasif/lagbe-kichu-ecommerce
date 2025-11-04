'use client'

import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { ToastContainer } from '@/components/Toast'
import AuthInitializer from '@/components/AuthInitializer'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      {children}
      <ToastContainer />
    </Provider>
  )
}

