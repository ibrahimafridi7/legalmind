import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useMe } from '../../queries/authQueries'
import { useAuth0Ready } from './Auth0LoadingContext'
import { isAuth0Enabled } from '../../lib/auth'
import type { UserRole } from '../../types/user.types'

function Auth0SessionError({ onRetry }: { onRetry: () => void }) {
  const { logout } = useAuth0()
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-brand-muted">Session could not be loaded.</p>
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

  // Not logged in: go to login. But if URL has Auth0 callback (?code=), wait for Auth0 to finish — don't redirect yet
  const isAuth0Callback = typeof window !== 'undefined' && window.location.search.includes('code=')
  if (isAuth0Enabled && !auth0Loading && !isAuthenticated && !isAuth0Callback) {
    return <Navigate to="/login" replace />
  }

  if ((isAuth0Enabled && (auth0Loading || !tokenReady)) || me.isLoading) {
    return <div className="p-6 text-sm text-brand-muted">Loading session…</div>
  }

  if (me.isError || !me.data) {
    if (isAuth0Enabled) return <Auth0SessionError onRetry={() => me.refetch()} />
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

