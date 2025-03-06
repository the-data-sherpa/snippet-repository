'use client'

import { useState, useRef, useEffect, RefObject, useMemo } from 'react'
import { getPooledSupabaseClient } from '@/context/AuthContext'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useAuth } from '@/context/AuthContext'

interface NewSnippetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewSnippetModal({ isOpen, onClose, onSuccess }: NewSnippetModalProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use useMemo for initialFormState to prevent it from changing on every render
  const initialFormState = useMemo(() => ({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: ''
  }), [])
  
  const [formData, setFormData] = useState(initialFormState)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState)
      setError(null)
    }
  }, [isOpen, initialFormState])

  // Type assertion to make the ref compatible with useClickOutside
  useClickOutside(modalRef as RefObject<HTMLElement>, () => {
    onClose()
  })

  if (!isOpen) return null

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submission started')
    
    if (!user || !profile) {
      setError('You must be logged in to submit a snippet')
      return
    }

    setError(null)
    setLoading(true)

    const connection = await getPooledSupabaseClient()
    try {
      // Validate form data
      console.log('Validating form data...')
      if (!formData.title.trim()) throw new Error('Title is required')
      if (!formData.code.trim()) throw new Error('Code is required')
      if (!formData.language) throw new Error('Language is required')

      // Clean and prepare the data
      const cleanedTags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .filter((tag, index, self) => self.indexOf(tag) === index)

      // Sanitize code content
      const sanitizedCode = formData.code
        .replace(/;/g, ';\n')
        .replace(/^\s*set\s+/gim, '-- set ')
        .trim()

      console.log('Form data validated, preparing to insert snippet...')
      
      // Insert the snippet using connection pooling
      const queryStartTime = performance.now()
      console.log('[Performance] Using indexes: snippets_username_idx, profiles_username_unique')
      const { data: newSnippet, error: insertError } = await connection.client
        .from('snippets')
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            code: sanitizedCode,
            language: formData.language,
            tags: cleanedTags,
            username: profile.username
          }
        ])
        .select(`
          id,
          title,
          description,
          code,
          language,
          tags,
          created_at,
          username,
          profiles!inner(username)
        `)
        .single()
        .throwOnError()

      const queryDuration = performance.now() - queryStartTime
      console.log(`[Performance] Database query took ${queryDuration.toFixed(2)}ms`)
      if (queryDuration > 1000) {
        console.warn('[Performance] Query took longer than 1s, might need optimization')
      }

      if (insertError) {
        console.error('[Performance] Error inserting snippet:', insertError)
        throw insertError
      }

      if (!newSnippet) {
        throw new Error('No data returned from insert')
      }

      console.log('Snippet created successfully:', newSnippet)

      // Reset form and close modal
      setFormData(initialFormState)
      setLoading(false)
      onSuccess()
    } catch (err) {
      console.error('Error creating snippet:', err)
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          setError('Operation timed out. Please try again with a smaller snippet.')
        } else if (err.message.includes('permission denied')) {
          setError('Unable to save snippet due to SQL command restrictions. Please remove any SET commands or similar SQL operations.')
        } else if (err.message.includes('connection')) {
          setError('Database connection error. Please try again in a moment.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to create snippet')
      }
      setLoading(false)
    } finally {
      connection.release()
    }
  }

  console.log('Render state:', { loading, error, formData }) // Add render logging

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit New Code Snippet</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              type="button"
            >
              ✕
            </button>
          </div>

          {authLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Checking authentication...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-4 text-red-500">
              Please sign in to submit snippets
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Explain what your code does and how to use it"
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <textarea
                  id="code"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Paste your code here"
                  rows={8}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-black placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Programming Language
                </label>
                <select
                  id="language"
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
                >
                  <option value="" className="text-gray-500">Select language</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                  <option value="kql">KQL</option>
                  <option value="bash">Bash</option>
                  <option value="powershell">PowerShell</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Enter tags separated by commas"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder-gray-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onClose()
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Snippet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 