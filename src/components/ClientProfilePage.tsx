'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ProfileInfo from '@/components/ProfileInfo'
import PasswordChange from '@/components/PasswordChange'
import { useAuth } from '@/context/AuthContext'

export default function ClientProfilePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('Profile Page - Not authenticated')
      router.push('/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto p-8">
          <div>Loading...</div>
        </main>
      </div>
    )
  }

  if (!profile) {
    console.log('Profile Page - No profile found')
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto p-8">
          <div>Profile not found</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        
        <div className="space-y-8">
          <ProfileInfo profile={profile} />
          <PasswordChange />
        </div>
      </main>
    </div>
  )
} 