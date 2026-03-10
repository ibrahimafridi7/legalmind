import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export type Auth0Ready = { isLoading: boolean; tokenReady: boolean }

const defaultReady: Auth0Ready = { isLoading: false, tokenReady: true }
const Auth0LoadingContext = createContext<Auth0Ready>(defaultReady)

/**
 * Must be used inside Auth0Provider. Delays useMe() until Auth0 has finished
 * loading and we've successfully obtained an access token (avoids 401 on first /me).
 */
export function Auth0LoadingProvider({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setTokenReady(false)
      return
    }
    if (isLoading) return
    getAccessTokenSilently()
      .then(() => setTokenReady(true))
      .catch(() => setTokenReady(false))
  }, [isLoading, isAuthenticated, getAccessTokenSilently])

  return (
    <Auth0LoadingContext.Provider value={{ isLoading, tokenReady }}>
      {children}
    </Auth0LoadingContext.Provider>
  )
}

/** Outside provider (e.g. dev mode): not loading, token ready. */
export function useAuth0Ready(): Auth0Ready {
  return useContext(Auth0LoadingContext)
}
