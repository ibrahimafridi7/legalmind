export const LoginPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 16, background: '#020617', padding: 24, boxShadow: '0 18px 45px rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Sign in to LegalMind</h1>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 16 }}>
          This is a placeholder login. Wire it up to Auth0 or MSAL using the config in `lib/auth.ts`.
        </p>
        <button className="btn btn-primary" style={{ width: '100%' }}>
          Continue with SSO
        </button>
      </div>
    </div>
  )
}

