'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
  updated_at: string
}

interface CommentModalProps {
  snippetId: string
  isOpen: boolean
  onClose: () => void
  currentUser: string | null
}

export default function CommentModal({ snippetId, isOpen, onClose, currentUser }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, snippetId])

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('snippet_comments')
        .select('*')
        .eq('snippet_id', snippetId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('snippet_comments')
        .insert([
          {
            snippet_id: snippetId,
            username: currentUser,
            content: newComment.trim()
          }
        ])

      if (error) throw error

      setNewComment('')
      loadComments()
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-900">{comment.username}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{comment.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-500">No comments yet</p>
            )}
          </div>

          {currentUser ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center text-gray-500">Sign in to comment</p>
          )}
        </div>
      </div>
    </div>
  )
} 