import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  console.log('Auth Callback - Request details:', {
    hasCode: !!code,
    next,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
  })

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Log cookies before exchange
      console.log('Auth Callback - Cookies before exchange:', {
        cookieNames: cookieStore.getAll().map(c => c.name)
      })

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Auth Callback - Exchange result:', {
        success: !error,
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        userEmail: data.session?.user?.email,
        error: error?.message,
        accessToken: data.session ? 'present' : 'missing',
        refreshToken: data.session?.refresh_token ? 'present' : 'missing'
      })

      if (error) throw error

      // Log cookies after exchange
      console.log('Auth Callback - Cookies after exchange:', {
        cookieNames: cookieStore.getAll().map(c => c.name)
      })

      // Verify session was created
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Auth Callback - Session verification:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: sessionError?.message,
        accessToken: session ? 'present' : 'missing',
        refreshToken: session?.refresh_token ? 'present' : 'missing'
      })

      if (!session) {
        throw new Error('Failed to establish session after exchange')
      }

      // Verify user data
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('Auth Callback - User verification:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        error: userError?.message
      })

    } catch (error) {
      console.error('Auth Callback - Error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Redirect to sign-in page on error
      return NextResponse.redirect(new URL('/signin', requestUrl.origin))
    }
  } else {
    console.log('Auth Callback - No code provided')
  }

  // Final cookie check before redirect
  const finalCookies = cookies()
  console.log('Auth Callback - Final cookie state:', {
    cookieNames: finalCookies.getAll().map(c => c.name),
    hasAuthCookie: finalCookies.getAll().some(c => c.name.includes('auth'))
  })

  console.log('Auth Callback - Completing, redirecting to home')
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 