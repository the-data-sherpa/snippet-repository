import Image from "next/image";
import SnippetCard from '@/components/SnippetCard';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Snippits</h1>
        
        <div className="space-y-4">
          <SnippetCard 
            title="Title"
            description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
          />
          <SnippetCard 
            title="Title"
            description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
          />
          <SnippetCard 
            title="Title"
            description="Body text for whatever you'd like to say. Add main takeaway points, quotes, anecdotes, or even a very very short story."
          />
        </div>
      </main>
    </div>
  );
}
