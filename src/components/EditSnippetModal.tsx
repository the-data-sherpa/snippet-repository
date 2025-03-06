'use client'

import { useState, useRef, useEffect, RefObject } from 'react'
import { getPooledSupabaseClient } from '@/context/AuthContext'
import { Snippet } from '@/types/snippets'
import { useClickOutside } from '@/hooks/useClickOutside'

interface EditSnippetModalProps {
  snippet: Snippet
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedSnippet: Snippet) => void
}

export default function EditSnippetModal({ snippet, isOpen, onClose, onUpdate }: EditSnippetModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Reset form data when snippet changes or modal opens
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: '',
    tags: ''
  })

  // Update form data when snippet changes or modal opens
  useEffect(() => {
    if (isOpen && snippet) {
      setFormData({
        title: snippet.title,
        description: snippet.description || '',
        code: snippet.code,
        language: snippet.language,
        tags: snippet.tags?.join(', ') || ''
      })
      setError(null)
    }
  }, [isOpen, snippet])

  const modalRef = useRef<HTMLDivElement>(null)
  
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

    const startTime = performance.now()
    console.log('[Performance] Starting snippet update...')

    const connection = await getPooledSupabaseClient()
    try {
      // Clean and prepare the data
      const cleanStartTime = performance.now()
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
      console.log(`[Performance] Data cleaning took ${(performance.now() - cleanStartTime).toFixed(2)}ms`)

      // Create a single update object with only changed fields
      const diffStartTime = performance.now()
      const updateData: Partial<Snippet> = {}
      
      if (formData.title.trim() !== snippet.title) {
        updateData.title = formData.title.trim()
      }
      if (formData.description.trim() !== snippet.description) {
        updateData.description = formData.description.trim()
      }
      if (sanitizedCode !== snippet.code) {
        updateData.code = sanitizedCode
      }
      if (formData.language !== snippet.language) {
        updateData.language = formData.language
      }
      if (JSON.stringify(cleanedTags) !== JSON.stringify(snippet.tags)) {
        updateData.tags = cleanedTags
      }
      console.log(`[Performance] Diff calculation took ${(performance.now() - diffStartTime).toFixed(2)}ms`)

      // Only proceed if there are changes to update
      if (Object.keys(updateData).length === 0) {
        console.log('[Performance] No changes detected, skipping update')
        onClose()
        return
      }

      console.log('[Performance] Fields to update:', Object.keys(updateData).join(', '))
      console.log('[Performance] Update payload size:', new Blob([JSON.stringify(updateData)]).size, 'bytes')

      // Use connection pooling for the update
      const queryStartTime = performance.now()
      console.log('[Performance] Using indexes: snippets_pkey, snippets_username_idx, profiles_username_unique')
      const { data, error } = await connection.client
        .from('snippets')
        .update(updateData)
        .match({
          id: snippet.id,
          username: snippet.username
        })
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

      if (error) {
        console.error('[Performance] Error updating snippet:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from update')
      }

      console.log(`[Performance] Total update operation took ${(performance.now() - startTime).toFixed(2)}ms`)
      onUpdate(data)
      onClose()
    } catch (err) {
      console.error('Error updating snippet:', err)
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          setError('Update timed out. Please try again with a smaller change.')
        } else if (err.message.includes('permission denied')) {
          setError('Unable to save snippet due to SQL command restrictions. Please remove any SET commands or similar SQL operations.')
        } else if (err.message.includes('connection')) {
          setError('Database connection error. Please try again in a moment.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to update snippet')
      }
    } finally {
      setLoading(false)
      connection.release()
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
            <h2 className="text-2xl font-bold text-gray-900">Edit Snippet</h2>
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 