import Navigation from '@/components/Navigation'
import SnippetList from '@/components/SnippetList'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <SnippetList />
    </div>
  )
}
