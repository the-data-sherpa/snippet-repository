'use client'

import Link from 'next/link'
import { useState } from 'react'
import UserMenu from './UserMenu'
import NewSnippetModal from './NewSnippetModal'
import { useAuth } from '@/context/AuthContext'

export default function Navigation() {
  const { user, loading } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)

  console.log('Navigation - Auth State:', { user, loading })

  if (loading) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
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
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
          >
            Snippit Repository
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu />
            ) : (
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
          window.location.reload()
        }}
      />
    </>
  )
} 