import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useMe } from '../../queries/authQueries'
import { useAuth0Ready } from './Auth0LoadingContext'
import { isAuth0Enabled } from '../../lib/auth'
import type { UserRole } from '../../types/user.types'

/** Wait this long after Auth0 "loaded" before treating user as logged out (lets session restore on refresh) */
const SESSION_RESTORE_MS = 2200

function Auth0SessionError({ onRetry, isNetworkError }: { onRetry: () => void; isNetworkError?: boolean }) {
  const { logout } = useAuth0()
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-brand-muted">
        {isNetworkError
          ? 'Could not reach the server. Check that the backend is running and try again.'
          : 'Session could not be loaded.'}
      </p>
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
        <button
          type="button"
          className="btn border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-800"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export const ProtectedRoute = ({
  children,
  roles
}: {
  children: ReactNode
  roles?: UserRole[]
}) => {
  const { isLoading: auth0Loading, tokenReady, isAuthenticated } = useAuth0Ready()
  const ready = !isAuth0Enabled || (!auth0Loading && tokenReady)
  const me = useMe({ enabled: ready })
  const [allowRedirectToLogin, setAllowRedirectToLogin] = useState(false)

  // On refresh, Auth0 restores session from cache; isAuthenticated can be false briefly. Wait before redirecting to login.
  useEffect(() => {
    if (!isAuth0Enabled || auth0Loading || isAuthenticated) {
      setAllowRedirectToLogin(false)
      return
    }
    const t = setTimeout(() => setAllowRedirectToLogin(true), SESSION_RESTORE_MS)
    return () => clearTimeout(t)
  }, [isAuth0Enabled, auth0Loading, isAuthenticated])

  const isAuth0Callback = typeof window !== 'undefined' && window.location.search.includes('code=')
  const notAuthenticated = isAuth0Enabled && !auth0Loading && !isAuthenticated && !isAuth0Callback
  if (notAuthenticated && allowRedirectToLogin) {
    return <Navigate to="/login" replace />
  }
  if (notAuthenticated) {
    return <div className="p-6 text-sm text-brand-muted">Loading session…</div>
  }

  if ((isAuth0Enabled && (auth0Loading || !tokenReady)) || me.isLoading) {
    return <div className="p-6 text-sm text-brand-muted">Loading session…</div>
  }

  if (me.isError || !me.data) {
    const isNetworkError =
      me.error &&
      typeof me.error === 'object' &&
      'code' in me.error &&
      (me.error as { code?: string }).code === 'ERR_NETWORK'
    if (isAuth0Enabled) return <Auth0SessionError onRetry={() => me.refetch()} isNetworkError={!!isNetworkError} />
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0 && !roles.includes(me.data.role)) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-slate-100">Unauthorized</h1>
        <p className="mt-2 text-sm text-brand-muted">You don’t have access to this page.</p>
      </div>
    )
  }

  return <>{children}</>
}

