/**
 * Path to go to after login, from the `?redirect=` query the auth middleware adds.
 * Only same-site paths are allowed ("/..." but not "//host" or "/\host"), so the
 * login page cannot be used to send people to another site. Anything else → "/".
 */
export function safeRedirectPath(value: unknown): string {
  const path = Array.isArray(value) ? value[0] : value
  if (typeof path !== 'string' || !path.startsWith('/')) return '/'
  if (path.startsWith('//') || path.startsWith('/\\')) return '/'
  if (path === '/login' || path.startsWith('/login?')) return '/'
  return path
}
