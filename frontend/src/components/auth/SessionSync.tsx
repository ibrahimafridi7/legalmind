import { useEffect } from 'react'
import { useMe } from '../../queries/authQueries'
import { useSessionStore } from '../../store/sessionStore'

/**
 * Syncs TanStack Query auth (useMe) into Zustand session store so components
 * that read useSessionStore().user (e.g. FileUploadManager RBAC) see the current user.
 */
export const SessionSync = () => {
  const { data: user } = useMe()
  const setUser = useSessionStore((s) => s.setUser)

  useEffect(() => {
    setUser(user ?? null)
  }, [user, setUser])

  return null
}
