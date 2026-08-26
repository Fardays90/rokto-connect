// Session token storage for non-cookie clients.
//
// The API sets an HttpOnly session cookie which works fine when frontend
// and backend share a site (localhost dev). When the deployed frontend
// talks to a localhost API the browser refuses third-party cookies, so we
// keep the token returned in the login/register response and send it as an
// Authorization: Bearer header instead (the server accepts both).

const TOKEN_KEY = 'rc_access_token'

export const getSessionToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setSessionToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearSessionToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}
