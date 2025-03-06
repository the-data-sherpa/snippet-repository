import RegisterForm from '@/components/RegisterForm'
import Navigation from '@/components/Navigation'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Register</h1>
        <RegisterForm />
      </main>
    </div>
  )
} 