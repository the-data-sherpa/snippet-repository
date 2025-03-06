'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import UserMenu from './UserMenu'
import { useRouter } from 'next/navigation'
import NewSnippetModal from './NewSnippetModal'

interface NavigationProps {
  showAuthButtons?: boolean
}

export default function Navigation({ showAuthButtons = true }: NavigationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        
        // Check authentication with Supabase using getUser() which is more secure
        const { data: { user }, error } = await supabase.auth.getUser()
        
        // Verify session with our API
        const response = await fetch('/api/auth/check')
        const authCheck = await response.json()

        console.log('Navigation - Auth check:', {
          hasUser: !!user,
          isAuthenticated: authCheck.authenticated,
          userId: user?.id,
          error: error?.message
        })

        setIsAuthenticated(!!user && authCheck.authenticated)
      } catch (error) {
        console.error('Navigation - Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Navigation - Auth state change:', { event, hasSession: !!session })
      
      if (event === 'SIGNED_IN') {
        // Verify authentication with getUser() after sign in
        try {
          const { data: { user } } = await supabase.auth.getUser()
          const response = await fetch('/api/auth/check')
          const authCheck = await response.json()
          setIsAuthenticated(!!user && authCheck.authenticated)
        } catch (error) {
          console.error('Navigation - Auth verification error:', error)
          setIsAuthenticated(false)
        }
        router.refresh()
      }
      
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false)
        router.refresh()
        router.push('/signin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
          >
            Snippit Repository
          </Link>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
          >
            Snippit Repository
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
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

      <NewSnippetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          window.location.reload() // This will refresh the page to show the new snippet
        }}
      />
    </>
  )
} 