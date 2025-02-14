'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Prism from 'prismjs'

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
  updated_at: string
}

interface Snippet {
  language: string
  code: string
}

interface CommentModalProps {
  snippet: Snippet
  isOpen: boolean
  onClose: () => void
  currentUser: string | null
  onCommentChange: () => void
}

export default function CommentModal({ snippet, isOpen, onClose, currentUser, onCommentChange }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
      Prism.highlightAll()
    }
  }, [isOpen])

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('snippet_comments')
        .select('*')
        .eq('snippet_id', snippet.id)
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
            snippet_id: snippet.id,
            username: currentUser,
            content: newComment.trim()
          }
        ])

      if (error) throw error

      setNewComment('')
      loadComments()
      onCommentChange()
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('snippet_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      loadComments()
      onCommentChange()
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment')
    }
  }

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
      kql: 'sql',
      other: 'markup'
    }
    return languageMap[language] || 'markup'
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

          <div className="mb-6">
            <div className="rounded-lg overflow-hidden bg-[#1e1e1e]">
              <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm text-gray-300">
                  {snippet.language}
                </span>
              </div>
              <pre className="p-4 max-h-[200px] overflow-y-auto">
                <code className={`language-${getLanguageClass(snippet.language)}`}>
                  {snippet.code}
                </code>
              </pre>
            </div>
          </div>

          <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{comment.username}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {currentUser === comment.username && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete comment"
                    >
                      <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  )}
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
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 text-black placeholder-gray-500"
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