'use client'

import { useState, useRef, useEffect, RefObject, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useClickOutside } from '@/hooks/useClickOutside'

interface NewSnippetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function NewSnippetModal({ isOpen, onClose, onSuccess }: NewSnippetModalProps) {
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
    setError(null)
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('email', user.email)
        .single()

      if (profileError || !profile) {
        throw new Error('Could not find user profile')
      }

      // Insert the snippet
      const { error: insertError } = await supabase
        .from('snippets')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            code: formData.code,
            language: formData.language,
            tags: formData.tags.split(',').map(tag => tag.trim()),
            username: profile.username
          }
        ])
        .select()
        .single()

      if (insertError) throw insertError

      // Call onSuccess instead of router.refresh()
      onSuccess()
    } catch (err) {
      console.error('Error creating snippet:', err)
      setError(err instanceof Error ? err.message : 'Failed to create snippet')
    } finally {
      setLoading(false)
    }
  }

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
            >
              ✕
            </button>
          </div>

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
                onClick={onClose}
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
        </div>
      </div>
    </div>
  )
} 