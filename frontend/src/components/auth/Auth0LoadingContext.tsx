import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export type Auth0Ready = { isLoading: boolean; tokenReady: boolean; isAuthenticated: boolean }

const defaultReady: Auth0Ready = { isLoading: false, tokenReady: true, isAuthenticated: false }
const Auth0LoadingContext = createContext<Auth0Ready>(defaultReady)

const RETRY_DELAY_MS = 800
const MAX_RETRIES = 3
const GIVE_UP_MS = 5000 // then allow useMe anyway so user isn't stuck

/**
 * Must be used inside Auth0Provider. Delays useMe() until we have a token or give up.
 * Effect deps are only isLoading + isAuthenticated so the 5s timer is not reset every render.
 */
export function Auth0LoadingProvider({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [tokenReady, setTokenReady] = useState(false)
  const getTokenRef = useRef(getAccessTokenSilently)
  getTokenRef.current = getAccessTokenSilently

  useEffect(() => {
    if (!isAuthenticated) {
      setTokenReady(false)
      return
    }
    if (isLoading) return

    let cancelled = false
    const giveUpTimer = setTimeout(() => {
      if (!cancelled) setTokenReady(true)
    }, GIVE_UP_MS)

    async function tryToken() {
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (cancelled) return
        try {
          await getTokenRef.current()
          if (!cancelled) setTokenReady(true)
          return
        } catch (e) {
          if (i === MAX_RETRIES - 1) {
            console.warn('[Auth0] Could not get access token:', e instanceof Error ? e.message : e)
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        }
      }
      if (!cancelled) setTokenReady(true)
    }
    tryToken()

    return () => {
      cancelled = true
      clearTimeout(giveUpTimer)
    }
  }, [isLoading, isAuthenticated])

  return (
    <Auth0LoadingContext.Provider value={{ isLoading, tokenReady, isAuthenticated }}>
      {children}
    </Auth0LoadingContext.Provider>
  )
}

/** Outside provider (e.g. dev mode): not loading, token ready. */
export function useAuth0Ready(): Auth0Ready {
  return useContext(Auth0LoadingContext)
}
