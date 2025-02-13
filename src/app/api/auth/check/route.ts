import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PROJECT_REF = 'dmizlbynkymnaopdgkdm'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get both session and user data
    const [sessionResponse, userResponse] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser()
    ])

    const { data: { session }, error: sessionError } = sessionResponse
    const { data: { user }, error: userError } = userResponse

    // Get all cookies
    const allCookies = await cookieStore.getAll()
    const authCookie = allCookies.find(c => c.name === `sb-${PROJECT_REF}-auth-token`)
    
    console.log('Session Check API - Details:', {
      hasSession: !!session,
      hasUser: !!user,
      sessionUserId: session?.user?.id,
      userId: user?.id,
      sessionError: sessionError?.message,
      userError: userError?.message,
      hasAuthCookie: !!authCookie,
      cookieNames: allCookies.map(c => c.name)
    })

    if (sessionError || userError) {
      console.error('Session Check API - Auth error:', { sessionError, userError })
      return NextResponse.json({ 
        session: false,
        error: sessionError?.message || userError?.message,
        details: 'Auth error occurred'
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        session: false,
        error: 'No authenticated user found',
        details: 'User is null or undefined'
      }, { status: 401 })
    }

    return NextResponse.json({ 
      session: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    })
  } catch (error) {
    console.error('Session Check API - Critical error:', error)
    return NextResponse.json({
      session: false,
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 