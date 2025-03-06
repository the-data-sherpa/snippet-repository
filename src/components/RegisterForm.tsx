'use client'

import { useState, useEffect } from 'react'
import { getPooledSupabaseClient } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function RegisterForm() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    verifyPassword: ''
  })

  useEffect(() => {
    // If already signed in, redirect to home
    if (user && !authLoading) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const validateEmail = (email: string): boolean => {
    const domain = email.split('@')[1]
    return domain === 'cribl.io'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setFormData(prev => ({
      ...prev,
      email
    }))

    if (email && !validateEmail(email)) {
      setError('Email must be a cribl.io domain')
    } else {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (formData.password !== formData.verifyPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Email must be a cribl.io domain')
      setLoading(false)
      return
    }

    const connection = await getPooledSupabaseClient()
    try {
      // Register the user
      const { error: signUpError } = await connection.client.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (signUpError) throw signUpError

      // Create the user profile
      const { error: profileError } = await connection.client
        .from('profiles')
        .insert([
          {
            username: formData.username,
            name: formData.name,
            email: formData.email,
          }
        ])

      if (profileError) throw profileError

      router.push('/signin')
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during registration')
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
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          required
          type="text"
          name="username"
          id="username"
          value={formData.username}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          required
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />
      </div>

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
          onChange={handleEmailChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
          placeholder="example@cribl.io"
        />
        {formData.email && !validateEmail(formData.email) && (
          <p className="mt-1 text-sm text-red-500">
            Must be a cribl.io email address
          </p>
        )}
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

      <div>
        <label htmlFor="verifyPassword" className="block text-sm font-medium text-gray-700">
          Verify Password
        </label>
        <input
          required
          type="password"
          name="verifyPassword"
          id="verifyPassword"
          value={formData.verifyPassword}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  )
} 