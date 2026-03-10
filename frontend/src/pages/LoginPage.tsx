export const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-dark">
      <div className="w-full max-w-md rounded-2xl bg-brand-surface p-8 shadow-xl">
        <h1 className="mb-2 text-xl font-semibold text-slate-100">Sign in to LegalMind</h1>
        <p className="mb-6 text-sm text-brand-muted">
          This is a placeholder login. Wire it up to Auth0 or MSAL using the config in `lib/auth.ts`.
        </p>
        <button className="w-full rounded-md bg-brand-action px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Continue with SSO
        </button>
      </div>
    </div>
  )
}

