/**
 * Minimal typing for Next's vendored path-to-regexp build, used by the
 * public-route-access matcher contract test. Only the single-argument form we
 * call is declared; extend if more of the API is ever needed.
 */
declare module 'next/dist/compiled/path-to-regexp' {
  export function pathToRegexp(path: string): RegExp
}
