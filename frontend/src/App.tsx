import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-brand-dark text-slate-100">
        <AppRouter />
      </div>
    </QueryClientProvider>
  )
}

