import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Auth0Provider } from '@auth0/auth0-react'
import { AppRouter } from './router'
import { SessionSync } from './components/auth/SessionSync'
import { AuthTokenAttach } from './components/auth/AuthTokenAttach'
import { Auth0LoadingProvider } from './components/auth/Auth0LoadingContext'
import { auth0Config, isAuth0Enabled } from './lib/auth'

const queryClient = new QueryClient()

const queryAndAuth = (
  <>
    {isAuth0Enabled && <AuthTokenAttach />}
    <SessionSync />
    <AppRouter />
  </>
)

export function App() {
  if (isAuth0Enabled) {
    return (
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          redirect_uri: auth0Config.redirectUri,
          ...(auth0Config.audience ? { audience: auth0Config.audience } : {})
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <Auth0LoadingProvider>
          <QueryClientProvider client={queryClient}>
            {queryAndAuth}
          </QueryClientProvider>
        </Auth0LoadingProvider>
      </Auth0Provider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {queryAndAuth}
    </QueryClientProvider>
  )
}
