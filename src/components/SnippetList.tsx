'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Snippet } from '@/types/snippets'
import Prism from 'prismjs'

// Import core Prism CSS
import 'prismjs/themes/prism.css'

export default function SnippetList() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Initialize Prism languages
  useEffect(() => {
    require('prismjs/components/prism-javascript')
    require('prismjs/components/prism-typescript')
    require('prismjs/components/prism-python')
    require('prismjs/components/prism-java')
    require('prismjs/components/prism-csharp')
    require('prismjs/components/prism-go')
    require('prismjs/components/prism-rust')
    require('prismjs/components/prism-bash')
    require('prismjs/components/prism-powershell')
    require('prismjs/components/prism-sql')
    require('prismjs/components/prism-markup') // For HTML
  }, [])

  useEffect(() => {
    async function loadSnippets() {
      try {
        const { data, error } = await supabase
          .from('snippets')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setSnippets(data)
      } catch (err) {
        console.error('Error loading snippets:', err)
        setError('Failed to load snippets')
      } finally {
        setLoading(false)
      }
    }

    loadSnippets()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll()
    }
  }, [snippets])

  // Map language values to Prism language classes
  const getLanguageClass = (language: string) => {
    const languageMap: { [key: string]: string } = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      csharp: 'csharp',
      go: 'go',
      rust: 'rust',
      bash: 'bash',
      powershell: 'powershell',
      kql: 'sql', // Using SQL highlighting for KQL
      other: 'markup' // Fallback to basic markup
    }
    return languageMap[language] || 'markup'
  }

  // Add copy function
  const handleCopy = async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(snippetId)
      setTimeout(() => setCopiedId(null), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading snippets...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg divide-y">
        {snippets.map((snippet) => (
          <div key={snippet.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {snippet.title}
                </h3>
                <p className="text-gray-600">
                  {snippet.description}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                by {snippet.username}
              </div>
            </div>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
                View Code
              </summary>
              <div className="mt-2 rounded-lg overflow-hidden bg-[#1e1e1e]">
                <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-sm text-gray-300">
                    {snippet.language}
                  </span>
                  <button
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                    className="text-sm text-gray-300 hover:text-white flex items-center gap-2"
                  >
                    {copiedId === snippet.id ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4">
                  <code className={`language-${getLanguageClass(snippet.language)}`}>
                    {snippet.code}
                  </code>
                </pre>
              </div>
            </details>

            <div className="mt-4 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {snippet.language}
              </span>
              {snippet.tags?.map((tag) => (
                <span 
                  key={tag} 
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 