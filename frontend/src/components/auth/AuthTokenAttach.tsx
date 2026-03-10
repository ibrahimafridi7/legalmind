import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { setAuthTokenGetter } from '../../lib/auth'

/**
 * When Auth0 is used, attaches getAccessTokenSilently to the API module
 * so axios sends the Bearer token on every request (silent refresh when needed).
 * Set on mount so the first /api/auth/me call after redirect already has the getter.
 */
export const AuthTokenAttach = () => {
  const { getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getAccessTokenSilently()
      } catch {
        return null
      }
    })
  }, [getAccessTokenSilently])

  return null
}
