import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

function wrapper(initialEntry = '/chat') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div>Chat content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Mock session (useMe) to test Protected Routes without real SSO tokens.
vi.mock('../../queries/authQueries', () => ({
  useMe: vi.fn()
}))

const useMe = (await import('../../queries/authQueries')).useMe as ReturnType<typeof vi.fn>

test('when useMe is loading, shows loading message', () => {
  useMe.mockReturnValue({ isLoading: true, data: null, isError: false })
  render(wrapper())
  expect(screen.getByText(/loading session/i)).toBeInTheDocument()
})

test('when useMe fails, redirects to login', () => {
  useMe.mockReturnValue({ isLoading: false, data: null, isError: true })
  render(wrapper())
  expect(screen.getByText('Login page')).toBeInTheDocument()
})

test('when useMe succeeds, renders children', () => {
  useMe.mockReturnValue({
    isLoading: false,
    data: { id: '1', name: 'Dev', email: 'dev@test.com', role: 'admin' },
    isError: false
  })
  render(wrapper())
  expect(screen.getByText('Chat content')).toBeInTheDocument()
})
