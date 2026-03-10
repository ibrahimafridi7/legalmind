import { useEffect } from 'react'
import { useMe } from '../../queries/authQueries'
import { useSessionStore } from '../../store/sessionStore'
import { useAuth0Loading } from './Auth0LoadingContext'
import { isAuth0Enabled } from '../../lib/auth'

/**
 * Syncs TanStack Query auth (useMe) into Zustand session store so components
 * that read useSessionStore().user (e.g. FileUploadManager RBAC) see the current user.
 */
export const SessionSync = () => {
  const auth0Loading = isAuth0Enabled && useAuth0Loading()
  const { data: user } = useMe({ enabled: !auth0Loading })
  const setUser = useSessionStore((s) => s.setUser)

  useEffect(() => {
    setUser(user ?? null)
  }, [user, setUser])

  return null
}
