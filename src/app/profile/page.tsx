import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Navigation from '@/components/Navigation'
import ProfileInfo from '@/components/ProfileInfo'
import PasswordChange from '@/components/PasswordChange'

export default async function ProfilePage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Profile Page - Session:', !!session)
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, name, email')
    .single()

  console.log('Profile Page - Profile data:', profile)

  if (!profile) {
    console.log('Profile Page - No profile found')
    throw new Error('Profile not found')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        
        <div className="space-y-8">
          <ProfileInfo initialProfile={profile} />
          <PasswordChange />
        </div>
      </main>
    </div>
  )
} 