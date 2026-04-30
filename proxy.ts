import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function proxy(request: NextRequest) {
  const session = getSessionCookie(request)

  const isAgentRoute = request.nextUrl.pathname.startsWith('/agent')
  const isLoginPage = request.nextUrl.pathname === '/agent/login'

  if (isAgentRoute && !isLoginPage && !session) {
    return NextResponse.redirect(new URL('/agent/login', request.url))
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/agent/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/agent/:path*'],
}