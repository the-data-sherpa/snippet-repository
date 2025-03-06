import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    // Create a Supabase client with the correct cookie handling for Next.js 15
    const supabase = await createClient()

    // Get user data directly using getUser() which is more secure
    // as it authenticates with the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('Session Check API - Details:', {
      authenticated: !!user,
      userId: user?.id,
      userError: userError?.message
    })

    if (userError) {
      return NextResponse.json({ 
        authenticated: false,
        error: userError.message
      }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: !!user,
      user: user
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 