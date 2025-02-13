import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-8 py-4 flex justify-between items-center">
        <div>
          {/* Logo placeholder if needed later */}
        </div>
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
      </div>
    </header>
  );
} 