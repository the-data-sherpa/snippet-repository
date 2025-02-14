'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Snippet } from '@/types/snippets'

interface EditSnippetModalProps {
  snippet: Snippet
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedSnippet: Snippet) => void
}

export default function EditSnippetModal({ snippet, isOpen, onClose, onUpdate }: EditSnippetModalProps) {
  const [formData, setFormData] = useState({
    title: snippet.title,
    description: snippet.description || '',
    code: snippet.code,
    language: snippet.language,
    tags: snippet.tags?.join(', ') || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const { data, error: updateError } = await supabase
        .from('snippets')
        .update({
          title: formData.title,
          description: formData.description,
          code: formData.code,
          language: formData.language,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
        .eq('id', snippet.id)
        .select()
        .single()

      if (updateError) throw updateError

      onUpdate(data)
      onClose()
    } catch (err) {
      console.error('Error updating snippet:', err)
      setError(err instanceof Error ? err.message : 'Failed to update snippet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Form fields - similar to NewSnippetModal */}
            {/* ... copy the form fields from NewSnippetModal ... */}

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