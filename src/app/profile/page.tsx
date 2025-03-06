import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Navigation from '@/components/Navigation'
import ProfileInfo from '@/components/ProfileInfo'
import PasswordChange from '@/components/PasswordChange'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  
  // Use getUser() which is more secure as it authenticates with the Supabase Auth server
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Profile Page - User:', !!user)
  
  if (!user || error) {
    console.log('Profile Page - Not authenticated:', error?.message)
    redirect('/signin')
  }
  
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