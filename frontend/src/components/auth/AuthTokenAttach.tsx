import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setAuthTokenGetter } from '../../lib/auth'

/**
 * When Auth0 is used, attaches getAccessTokenSilently to the API module
 * so axios sends the Bearer token on every request (silent refresh when needed).
 */
export const AuthTokenAttach = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) return
    setAuthTokenGetter(async () => {
      try {
        return await getAccessTokenSilently()
      } catch {
        return null
      }
    })
  }, [getAccessTokenSilently, isAuthenticated])

  return null
}
