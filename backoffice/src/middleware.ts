import { NextRequest, NextResponse } from 'next/server'
import cfg, { getVersions } from '@/config'
 
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const versions = getVersions().map(v => cfg(v))

  const cspHeader = `
    script-src 'self' 'nonce-${nonce}' https://accounts.google.com/ https://www.googletagmanager.com https://appleid.cdn-apple.com ${!!process.env.DEV ? 
      //In dev-only, allow dynamic scripts - necessary for hot reload
      `'unsafe-eval'`
      : ''};
    connect-src 'self' https://api.cloudinary.com/ https://maps.googleapis.com https://region1.google-analytics.com ${versions.map(v => v.apiUrl).join(' ')} ${versions.map(v => v.subscriptionsUrl).join(' ')};
    img-src 'self' blob: data: https://res.cloudinary.com https://maps.gstatic.com https://maps.googleapis.com https://fonts.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
`
  // Replace newline characters and spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()
 
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
 
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )
 
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )
 
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}