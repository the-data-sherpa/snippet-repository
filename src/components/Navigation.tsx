'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import UserMenu from './UserMenu'

interface NavigationProps {
  showAuthButtons?: boolean
}

export default function Navigation({ showAuthButtons = true }: NavigationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
          >
            Snippits
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link 
          href="/" 
          className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
        >
          Snippits
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Create New Snippit
              </button>
              <UserMenu />
            </>
          ) : showAuthButtons && (
            <div className="flex gap-2">
              <Link 
                href="/signin" 
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 