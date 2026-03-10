import { createContext, useContext, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const Auth0LoadingContext = createContext(false)

/**
 * Must be used inside Auth0Provider. Provides Auth0's isLoading so that
 * useMe() can be delayed until after redirect/session restore.
 */
export function Auth0LoadingProvider({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth0()
  return (
    <Auth0LoadingContext.Provider value={isLoading}>
      {children}
    </Auth0LoadingContext.Provider>
  )
}

/** When true, Auth0 is still loading (e.g. after redirect). When false or outside provider, treat as ready. */
export function useAuth0Loading(): boolean {
  return useContext(Auth0LoadingContext)
}
