import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useMe } from '../../queries/authQueries'
import { useAuth0Ready } from './Auth0LoadingContext'
import { isAuth0Enabled } from '../../lib/auth'
import type { UserRole } from '../../types/user.types'

export const ProtectedRoute = ({
  children,
  roles
}: {
  children: ReactNode
  roles?: UserRole[]
}) => {
  const { isLoading: auth0Loading, tokenReady } = useAuth0Ready()
  const ready = !isAuth0Enabled || (!auth0Loading && tokenReady)
  const me = useMe({ enabled: ready })

  if ((isAuth0Enabled && (auth0Loading || !tokenReady)) || me.isLoading) {
    return <div className="p-6 text-sm text-brand-muted">Loading session…</div>
  }

  if (me.isError || !me.data) {
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

