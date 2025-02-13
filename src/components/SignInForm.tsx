'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Get the project reference from your Supabase URL
const PROJECT_REF = 'dmizlbynkymnaopdgkdm'

export default function SignInForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('SignInForm - Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing'
      })
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SignInForm - Auth state change:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing'
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log('SignInForm - Starting sign in process')
      
      // Sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      console.log('SignInForm - Sign in response:', {
        success: true,
        hasUser: !!signInData?.user,
        userId: signInData?.user?.id,
        hasSession: !!signInData?.session
      })

      // Wait for session to be established
      let session = signInData.session
      if (!session) {
        throw new Error('No session in sign-in response')
      }

      // Set auth cookie with exact Supabase format
      const cookieOptions = 'path=/;max-age=28800;secure;samesite=lax'
      const cookieName = `sb-${PROJECT_REF}-auth-token`
      const cookieValue = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        type: 'access_token'
      })

      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)};${cookieOptions}`

      // Wait a moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify session with server
      const response = await fetch('/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const responseData = await response.json()
      console.log('SignInForm - Server response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to verify session with server')
      }

      console.log('SignInForm - Authentication successful, redirecting')
      router.refresh()
      router.push('/')
    } catch (err) {
      console.error('SignInForm - Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          required
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          required
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
} 