/**
 * Auth0 configuration and token getter for API requests.
 * Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and optionally VITE_AUTH0_AUDIENCE (API identifier).
 */

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN as string,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID as string,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined,
  redirectUri: typeof window !== 'undefined' ? window.location.origin : ''
}

export const isAuth0Enabled = Boolean(
  auth0Config.domain && auth0Config.clientId
)

/** Called by a component inside Auth0Provider to supply the token getter for API requests. */
let tokenGetter: (() => Promise<string | null>) | null = null

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

export async function getAuthToken(): Promise<string | null> {
  if (!tokenGetter) return null
  try {
    return await tokenGetter()
  } catch {
    return null
  }
}
