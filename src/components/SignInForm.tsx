'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPooledSupabaseClient } from '@/context/AuthContext'
import { useAuth } from '@/context/AuthContext'

export default function SignInForm() {
  const router = useRouter()
  const { user, loading: authLoading, refreshAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    // If already signed in, redirect to home
    if (user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

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

    const connection = await getPooledSupabaseClient()
    try {
      console.log('SignInForm - Starting sign in process')
      
      // Sign in with pooled connection
      const { error: signInError } = await connection.client.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) throw signInError

      // Refresh auth context to get the latest user state
      await refreshAuth()

      console.log('SignInForm - Authentication successful')
      router.push('/')
    } catch (err) {
      console.error('SignInForm - Error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setLoading(false)
      connection.release()
    }
  }

  if (authLoading) {
    return <div>Loading...</div>
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