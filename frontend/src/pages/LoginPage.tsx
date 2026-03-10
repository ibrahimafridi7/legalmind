import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { isAuth0Enabled } from '../lib/auth'

function LoginPageAuth0() {
  const navigate = useNavigate()
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (isAuthenticated) navigate('/chat', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-brand-surface p-8 shadow-xl">
        <h1 className="mb-2 text-xl font-semibold text-slate-100">Sign in to LegalMind</h1>
        <p className="text-muted mb-6 text-sm">Use your organization’s SSO (Auth0) to sign in.</p>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => loginWithRedirect()}
          disabled={isLoading}
        >
          {isLoading ? 'Redirecting…' : 'Continue with SSO'}
        </button>
      </div>
    </div>
  )
}

function LoginPageDev() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-brand-surface p-8 shadow-xl">
        <h1 className="mb-2 text-xl font-semibold text-slate-100">Sign in to LegalMind</h1>
        <p className="text-muted mb-6 text-sm">
          Auth0 is not configured. Use dev mode (backend must return /api/auth/me).
        </p>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => navigate('/chat', { replace: true })}
        >
          Dev: Continue to app
        </button>
      </div>
    </div>
  )
}

export const LoginPage = () => (isAuth0Enabled ? <LoginPageAuth0 /> : <LoginPageDev />)

