import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Only check auth for protected routes
  if (req.nextUrl.pathname.startsWith('/profile')) {
    try {
      // Try to get the session
      const { data: { session }, error } = await supabase.auth.getSession()

      // Get user data directly
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // Log all relevant information
      console.log('Middleware - Auth details:', {
        path: req.nextUrl.pathname,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        userId: user?.id,
        cookies: req.cookies.getAll().map(c => c.name),
        sessionError: error?.message,
        userError: userError?.message
      })

      if (!user) {
        console.log('Middleware - No authenticated user found')
        return NextResponse.redirect(new URL('/signin', req.url))
      }

      // Add user info to request headers
      res.headers.set('x-user-id', user.id)
      res.headers.set('x-user-email', user.email || '')

      return res
    } catch (error) {
      console.error('Middleware - Critical error:', error)
      return NextResponse.redirect(new URL('/signin', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/profile/:path*']
} 