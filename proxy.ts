import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/agent') {
    return NextResponse.redirect(new URL('/agent/login', request.url))
  }
}

export const config = {
  matcher: ['/agent'],
}