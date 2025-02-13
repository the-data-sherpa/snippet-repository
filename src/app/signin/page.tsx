import SignInForm from '@/components/SignInForm'
import Navigation from '@/components/Navigation'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showAuthButtons={false} />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Sign In</h1>
        <SignInForm />
      </main>
    </div>
  )
} 