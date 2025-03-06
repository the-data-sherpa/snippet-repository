'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SignInForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const supabase = createClient()
    
    const checkSession = async () => {
      // Use getUser() which is more secure as it authenticates with the Supabase Auth server
      const { data: { user }, error } = await supabase.auth.getUser()
      
      console.log('SignInForm - Initial auth check:', {
        isAuthenticated: !!user,
        userId: user?.id,
        error: error?.message
      })
      
      // If already signed in, redirect to home
      if (user) {
        router.push('/')
      }
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('SignInForm - Auth state change:', {
        event,
        hasSession: !!session
      })
      
      // For SIGNED_IN events, verify the user with getUser()
      if (event === 'SIGNED_IN') {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('SignInForm - Verified user after sign in:', {
          isAuthenticated: !!user,
          userId: user?.id
        })
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

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
      const supabase = createClient()
      
      // Sign in with Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      // Verify the user with getUser() which is more secure
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error(userError?.message || 'Failed to authenticate user')
      }

      console.log('SignInForm - Authentication successful:', {
        userId: user.id
      })
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('SignInForm - Redirecting')
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