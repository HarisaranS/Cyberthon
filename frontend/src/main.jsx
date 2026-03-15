import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false } }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#0D1018', color: '#C8D4F0', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'DM Sans' },
        success: { iconTheme: { primary: '#00FF9D', secondary: '#07090F' } },
        error: { iconTheme: { primary: '#FF4D6D', secondary: '#07090F' } }
      }}
    />
  </QueryClientProvider>
)
