'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Snippet } from '@/types/snippets'
import Prism from 'prismjs'
import EditSnippetModal from './EditSnippetModal'
import NewSnippetModal from './NewSnippetModal'
import { User } from '@supabase/supabase-js'
import CommentModal from './CommentModal'

// Import core Prism CSS
import 'prismjs/themes/prism.css'

interface VoteCount {
  upvotes: number
  downvotes: number
  userVote: boolean | null // true for upvote, false for downvote, null for no vote
}

export default function SnippetList() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [votes, setVotes] = useState<Record<string, VoteCount>>({})
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [commentSnippetId, setCommentSnippetId] = useState<string | null>(null)

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

  // Get current user on mount
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('email', user.email)
          .single()
        
        if (profile) {
          setCurrentUser(profile.username)
        }
      }
    }
    getUser()
  }, [])

  const loadSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSnippets(data)
      setAvailableTags(getUniqueTags(data))
    } catch (err) {
      console.error('Error loading snippets:', err)
      setError('Failed to load snippets')
    } finally {
      setLoading(false)
    }
  }

  const loadVotes = async () => {
    try {
      const { data: voteData, error: voteError } = await supabase
        .from('snippet_votes')
        .select('snippet_id, vote_type, username')

      if (voteError) throw voteError

      // Calculate vote counts
      const voteCounts: Record<string, VoteCount> = {}
      voteData.forEach(vote => {
        if (!voteCounts[vote.snippet_id]) {
          voteCounts[vote.snippet_id] = {
            upvotes: 0,
            downvotes: 0,
            userVote: null
          }
        }
        if (vote.vote_type) {
          voteCounts[vote.snippet_id].upvotes++
        } else {
          voteCounts[vote.snippet_id].downvotes++
        }
        if (vote.username === currentUser) {
          voteCounts[vote.snippet_id].userVote = vote.vote_type
        }
      })

      setVotes(voteCounts)
    } catch (err) {
      console.error('Error loading votes:', err)
    }
  }

  const loadCommentCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('snippet_comments')
        .select('snippet_id, count')
        .select('*', { count: 'exact' })
        .group_by('snippet_id')

      if (error) throw error

      const counts: Record<string, number> = {}
      data.forEach(row => {
        counts[row.snippet_id] = parseInt(row.count)
      })
      setCommentCounts(counts)
    } catch (err) {
      console.error('Error loading comment counts:', err)
    }
  }

  useEffect(() => {
    loadSnippets()
    loadVotes()
    loadCommentCounts()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll()
    }
  }, [filteredSnippets])

  useEffect(() => {
    const searchLower = searchTerm.toLowerCase()
    const filtered = snippets.filter(snippet => {
      const matchesSearch = 
        snippet.title.toLowerCase().includes(searchLower) ||
        snippet.description.toLowerCase().includes(searchLower) ||
        snippet.language.toLowerCase().includes(searchLower)

      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => snippet.tags?.includes(tag))

      return matchesSearch && matchesTags
    })
    
    setFilteredSnippets(filtered)
  }, [searchTerm, snippets, selectedTags])

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

  const handleDelete = async (snippetId: string) => {
    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', snippetId)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      // Update both snippets and filtered snippets
      const updatedSnippets = snippets.filter(s => s.id !== snippetId)
      setSnippets(updatedSnippets)
      setFilteredSnippets(updatedSnippets)
      setAvailableTags(getUniqueTags(updatedSnippets))
      setOpenMenuId(null)

    } catch (err) {
      console.error('Error deleting snippet:', err)
      alert('Failed to delete snippet. Please try again.')
    }
  }

  // Update the click-outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('Clicking outside menu')
        setOpenMenuId(null)
      }
    }

    if (openMenuId) { // Only add listener when menu is open
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId]) // Add openMenuId as dependency

  // Add update handler
  const handleUpdate = (updatedSnippet: Snippet) => {
    setSnippets(prev => 
      prev.map(s => s.id === updatedSnippet.id ? updatedSnippet : s)
    )
  }

  // Pass loadSnippets to NewSnippetModal
  const handleNewSnippet = () => {
    setIsModalOpen(true)
  }

  // Add voting handler
  const handleVote = async (snippetId: string, voteType: boolean) => {
    if (!currentUser) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentVote = votes[snippetId]?.userVote

      // If clicking the same vote type, remove the vote
      if (currentVote === voteType) {
        const { error } = await supabase
          .from('snippet_votes')
          .delete()
          .eq('snippet_id', snippetId)
          .eq('username', currentUser)

        if (error) throw error
      } else {
        // If switching votes or voting for the first time, upsert the new vote
        const { error } = await supabase
          .from('snippet_votes')
          .upsert({
            snippet_id: snippetId,
            username: currentUser,
            user_id: user.id,
            vote_type: voteType
          }, {
            onConflict: 'snippet_id,username',
            ignoreDuplicates: false
          })

        if (error) throw error
      }

      // Update local state immediately for better UX
      setVotes(prev => ({
        ...prev,
        [snippetId]: {
          ...prev[snippetId],
          userVote: currentVote === voteType ? null : voteType,
          upvotes: calculateNewVoteCount(prev[snippetId]?.upvotes || 0, currentVote, voteType, true),
          downvotes: calculateNewVoteCount(prev[snippetId]?.downvotes || 0, currentVote, voteType, false)
        }
      }))

      // Reload votes from server to ensure consistency
      await loadVotes()
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  // Helper function to calculate new vote counts
  const calculateNewVoteCount = (
    currentCount: number,
    oldVote: boolean | null,
    newVote: boolean,
    isUpvote: boolean
  ): number => {
    if (oldVote === newVote) {
      // Removing vote
      return isUpvote === oldVote ? currentCount - 1 : currentCount
    } else if (oldVote === !isUpvote) {
      // Switching vote
      return isUpvote === newVote ? currentCount + 1 : currentCount - 1
    } else {
      // New vote
      return isUpvote === newVote ? currentCount + 1 : currentCount
    }
  }

  // Add this function to get unique tags from snippets
  const getUniqueTags = (snippets: Snippet[]) => {
    const tags = new Set<string>()
    snippets.forEach(snippet => {
      snippet.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  // Add tag toggle handler
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // Add handler for comment click
  const handleCommentClick = (snippetId: string) => {
    setCommentSnippetId(snippetId)
  }

  if (loading) {
    return <div className="text-center py-4">Loading snippets...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-4 relative z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search snippets by title, description, or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent text-black placeholder-gray-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Filter by tags:</div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${selectedTags.includes(tag)
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <span className="ml-2">×</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg divide-y">
          {filteredSnippets.map((snippet) => (
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
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    by {snippet.username}
                  </div>
                  {currentUser === snippet.username && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === snippet.id ? null : snippet.id)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                      
                      {openMenuId === snippet.id && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                          role="menu"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setEditingSnippet(snippet)
                              setOpenMenuId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit Snippet
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this snippet?')) {
                                supabase
                                  .from('snippets')
                                  .delete()
                                  .eq('id', snippet.id)
                                  .then(({ error }) => {
                                    if (error) {
                                      console.error('Delete error:', error)
                                      alert('Failed to delete snippet')
                                    } else {
                                      const updatedSnippets = snippets.filter(s => s.id !== snippet.id)
                                      setSnippets(updatedSnippets)
                                      setFilteredSnippets(updatedSnippets)
                                      setAvailableTags(getUniqueTags(updatedSnippets))
                                    }
                                  })
                              }
                              setOpenMenuId(null)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete Snippet
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

              <div className="mt-4 flex items-center justify-between">
                {/* Left side - tags */}
                <div className="flex items-center gap-2">
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

                {/* Right side - comments and votes */}
                <div className="flex items-center gap-4">
                  {/* Comments */}
                  <button
                    onClick={() => handleCommentClick(snippet.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                    title="View comments"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      {commentCounts[snippet.id] || 0}
                    </span>
                  </button>

                  {/* Voting */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(snippet.id, true)}
                      disabled={!currentUser}
                      className={`p-1 hover:bg-gray-100 transition-colors ${
                        votes[snippet.id]?.userVote === true 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`}
                      title={currentUser ? 'Upvote' : 'Sign in to vote'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 15l8-8 8 8H4z" />
                      </svg>
                    </button>
                    <span className={`text-base font-semibold min-w-[2rem] text-center ${
                      ((votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)) > 0
                        ? 'text-green-700'
                        : ((votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)) < 0
                          ? 'text-blue-700'
                          : 'text-gray-600'
                    }`}>
                      {(votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)}
                    </span>
                    <button
                      onClick={() => handleVote(snippet.id, false)}
                      disabled={!currentUser}
                      className={`p-1 hover:bg-gray-100 transition-colors ${
                        votes[snippet.id]?.userVote === false 
                          ? 'text-blue-600' 
                          : 'text-gray-400'
                      }`}
                      title={currentUser ? 'Downvote' : 'Sign in to vote'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 9l8 8 8-8H4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add a "no results" message */}
          {filteredSnippets.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No snippets found matching your search.
            </div>
          )}
        </div>
      </div>

      {editingSnippet && (
        <EditSnippetModal
          snippet={editingSnippet}
          isOpen={true}
          onClose={() => setEditingSnippet(null)}
          onUpdate={handleUpdate}
        />
      )}

      <NewSnippetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          loadSnippets() // Reload snippets after successful creation
        }}
      />

      {commentSnippetId && (
        <CommentModal
          snippetId={commentSnippetId}
          isOpen={true}
          onClose={() => setCommentSnippetId(null)}
          currentUser={currentUser}
        />
      )}
    </>
  )
} 