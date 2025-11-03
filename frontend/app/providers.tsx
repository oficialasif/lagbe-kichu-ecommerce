'use client'

import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { ToastContainer } from '@/components/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <ToastContainer />
    </Provider>
  )
}

