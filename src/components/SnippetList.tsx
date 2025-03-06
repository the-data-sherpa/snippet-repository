'use client'

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { getPooledSupabaseClient } from '@/context/AuthContext'
import { Snippet } from '@/types/snippets'
import Prism from 'prismjs'
import EditSnippetModal from './EditSnippetModal'
import NewSnippetModal from './NewSnippetModal'
import CommentModal from './CommentModal'
import { useAuth } from '@/context/AuthContext'
import debounce from 'lodash/debounce'

// We only need username from the profile for this component
type PartialProfile = {
  username: string | null
}

// Import core Prism CSS and components
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-powershell'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markup'

interface VoteCount {
  upvotes: number
  downvotes: number
  userVote: boolean | null // true for upvote, false for downvote, null for no vote
}

// Map language values to Prism language classes
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

interface SnippetItemProps {
  snippet: Snippet
  style: React.CSSProperties
  onCopy: (code: string, id: string) => void
  copiedId: string | null
  votes: Record<string, VoteCount>
  commentCounts: Record<string, number>
  loadingVotes: boolean
  loadingComments: boolean
  profile: PartialProfile | null
  onVote: (id: string, type: boolean) => void
  onComment: (id: string) => void
  onEdit: (snippet: Snippet) => void
  onDelete: (id: string) => void
  openMenuId: string | null
  setOpenMenuId: (id: string | null) => void
  menuRef: React.RefObject<HTMLDivElement | null>
  isExpanded: boolean
  onExpand: (snippetId: string, isExpanded: boolean) => void
}

// Create a memoized snippet item component
const SnippetItem = memo(({ 
  snippet, 
  onCopy, 
  copiedId, 
  votes, 
  commentCounts, 
  loadingVotes, 
  loadingComments, 
  profile, 
  onVote, 
  onComment, 
  onEdit,
  onDelete,
  openMenuId,
  setOpenMenuId
}: Omit<SnippetItemProps, 'style' | 'isExpanded' | 'onExpand' | 'menuRef'>) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Add click-outside handler at the item level
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId === snippet.id) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId, snippet.id, setOpenMenuId])

  useEffect(() => {
    if (isExpanded) {
      const codeElement = document.querySelector(`#code-${snippet.id}`)
      if (codeElement) {
        Prism.highlightElement(codeElement)
      }
    }
  }, [isExpanded, snippet.id])

  return (
    <div className="p-6 border-b border-gray-200 bg-white">
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {snippet.title}
            </h3>
            <p className="text-gray-600 mt-1">
              {snippet.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              by {snippet.username}
            </div>
            {profile?.username === snippet.username && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuId(openMenuId === snippet.id ? null : snippet.id)
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {openMenuId === snippet.id && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onEdit(snippet)
                        setOpenMenuId(null)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Snippet
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete(snippet.id)
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

        <div className="flex flex-wrap gap-2 mt-4">
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
        
        <details 
          className="mt-4"
          open={isExpanded}
          onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-gray-700 hover:text-gray-900">
            View Code
          </summary>
          {isExpanded && (
            <div className="mt-2 rounded-lg overflow-hidden bg-[#1e1e1e]">
              <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm text-gray-300">
                  {snippet.language}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCopy(snippet.code, snippet.id)
                  }}
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
              <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                <pre className="p-4 m-0">
                  <code id={`code-${snippet.id}`} className={`language-${languageMap[snippet.language] || 'markup'}`}>
                    {snippet.code}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </details>

        <div className="mt-4 flex items-center gap-4">
          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onComment(snippet.id)
            }}
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
              {loadingComments ? (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
              ) : (
                commentCounts[snippet.id] || 0
              )}
            </span>
          </button>

          {/* Voting */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote(snippet.id, true)
              }}
              disabled={!profile?.username || loadingVotes}
              className={`p-1 hover:bg-gray-100 transition-colors ${
                votes[snippet.id]?.userVote === true 
                  ? 'text-green-600' 
                  : 'text-gray-400'
              }`}
              title={profile?.username ? 'Upvote' : 'Sign in to vote'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 15l8-8 8 8H4z" />
              </svg>
            </button>
            <span className={`text-base font-semibold min-w-[2rem] text-center ${
              loadingVotes 
                ? 'text-gray-400'
                : ((votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)) > 0
                  ? 'text-green-700'
                  : ((votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)) < 0
                    ? 'text-blue-700'
                    : 'text-gray-600'
            }`}>
              {loadingVotes ? (
                <div className="w-4 h-4 mx-auto rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
              ) : (
                (votes[snippet.id]?.upvotes || 0) - (votes[snippet.id]?.downvotes || 0)
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVote(snippet.id, false)
              }}
              disabled={!profile?.username || loadingVotes}
              className={`p-1 hover:bg-gray-100 transition-colors ${
                votes[snippet.id]?.userVote === false 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`}
              title={profile?.username ? 'Downvote' : 'Sign in to vote'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 9l8 8 8-8H4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
SnippetItem.displayName = 'SnippetItem'

const FETCH_TIMEOUT = 10000 // 10 seconds timeout

export default function SnippetList() {
  const { profile } = useAuth()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingVotes, setLoadingVotes] = useState(true)
  const [loadingComments, setLoadingComments] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [votes, setVotes] = useState<Record<string, VoteCount>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(['All'])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All')
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [commentSnippetId, setCommentSnippetId] = useState<string | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const searchIndex = useRef<Record<string, Set<string>>>({
    title: new Set(),
    description: new Set(),
    code: new Set(),
    tags: new Set()
  })

  const loadVotes = useCallback(async () => {
    setLoadingVotes(true)
    const startTime = performance.now()
    console.log('[Performance] Starting votes fetch...')
    console.log('[Performance] Using indexes: snippet_votes_snippet_id_username_key')

    const connection = await getPooledSupabaseClient()
    try {
      const { data: voteData, error: voteError } = await connection.client
        .from('snippet_votes')
        .select('snippet_id, vote_type, username')

      const queryDuration = performance.now() - startTime
      console.log(`[Performance] Votes fetch took ${queryDuration.toFixed(2)}ms`)
      if (queryDuration > 1000) {
        console.warn('[Performance] Votes query took longer than 1s, might need optimization')
      }

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
        if (vote.username === profile?.username) {
          voteCounts[vote.snippet_id].userVote = vote.vote_type
        }
      })

      setVotes(voteCounts)
    } catch (err) {
      console.error('[Performance] Error loading votes:', err)
    } finally {
      setLoadingVotes(false)
      connection.release()
    }
  }, [profile?.username])

  const loadCommentCounts = useCallback(async () => {
    setLoadingComments(true)
    const startTime = performance.now()
    console.log('[Performance] Starting comment counts fetch...')
    console.log('[Performance] Using indexes: snippet_comments_snippet_id_idx')

    const connection = await getPooledSupabaseClient()
    try {
      const { data, error } = await connection.client
        .from('snippet_comments')
        .select('snippet_id')

      const queryDuration = performance.now() - startTime
      console.log(`[Performance] Comment counts fetch took ${queryDuration.toFixed(2)}ms`)
      if (queryDuration > 1000) {
        console.warn('[Performance] Comment counts query took longer than 1s, might need optimization')
      }

      if (error) throw error

      // Count comments for each snippet
      const counts: Record<string, number> = {}
      data.forEach(comment => {
        counts[comment.snippet_id] = (counts[comment.snippet_id] || 0) + 1
      })
      setCommentCounts(counts)
    } catch (err) {
      console.error('[Performance] Error loading comment counts:', err)
    } finally {
      setLoadingComments(false)
      connection.release()
    }
  }, [])

  const fetchSnippets = useCallback(async () => {
    setLoading(true)
    const startTime = performance.now()
    console.log('[Performance] Starting snippet fetch...')

    const connection = await getPooledSupabaseClient()
    try {
      const fetchStartTime = performance.now()
      console.log('[Performance] Using indexes: snippets_pkey, snippets_username_idx, profiles_username_unique')
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout')), FETCH_TIMEOUT)
      })

      // Race between the fetch and the timeout
      const { data: snippets } = await Promise.race([
        connection.client
          .from('snippets')
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
          .order('created_at', { ascending: false }),
        timeoutPromise
      ]) as { data: Snippet[] }

      console.log(`[Performance] Database fetch took ${(performance.now() - fetchStartTime).toFixed(2)}ms`)

      if (!snippets) {
        throw new Error('No snippets returned')
      }

      console.log(`[Performance] Fetched ${snippets.length} snippets`)
      setSnippets(snippets)
      setAvailableTags(getUniqueTags(snippets))
      const languages = Array.from(new Set(snippets.map(snippet => snippet.language)))
        .filter(Boolean)
        .sort()
      setAvailableLanguages(['All', ...languages])
      console.log(`[Performance] Total fetch operation took ${(performance.now() - startTime).toFixed(2)}ms`)
    } catch (error) {
      console.error('[Performance] Failed to fetch snippets:', error)
      if (error instanceof Error && error.message === 'Fetch timeout') {
        setError('Request timed out. Please try again.')
      } else {
        setError('Failed to load snippets. Click to retry.')
      }
      // Increment retry count to trigger a retry
      setRetryCount(prev => prev + 1)
    } finally {
      setLoading(false)
      connection.release()
    }
  }, [])

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      if (!mounted) return
      await fetchSnippets()
      if (!mounted) return
      await Promise.all([
        loadVotes().catch(console.error),
        loadCommentCounts().catch(console.error)
      ])
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [retryCount, fetchSnippets, loadVotes, loadCommentCounts])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Prism.highlightAll()
    }
  }, [snippets])

  // Create memoized search index
  const updateSearchIndex = useCallback((snippets: Snippet[]) => {
    const newIndex: Record<string, Set<string>> = {
      title: new Set(),
      description: new Set(),
      code: new Set(),
      tags: new Set()
    }

    snippets.forEach(snippet => {
      // Index all searchable fields
      snippet.title.toLowerCase().split(/\s+/).forEach(word => newIndex.title.add(word))
      if (snippet.description) {
        snippet.description.toLowerCase().split(/\s+/).forEach(word => newIndex.description.add(word))
      }
      snippet.code.toLowerCase().split(/\s+/).forEach(word => newIndex.code.add(word))
      snippet.tags?.forEach(tag => newIndex.tags.add(tag.toLowerCase()))
    })

    searchIndex.current = newIndex
  }, [])

  // Update search index when snippets change
  useEffect(() => {
    updateSearchIndex(snippets)
  }, [snippets, updateSearchIndex])

  // Debounce search term updates
  useEffect(() => {
    const debouncedSearch = debounce((term: string) => {
      setDebouncedSearchTerm(term)
    }, 300)

    debouncedSearch(searchTerm)
    return () => debouncedSearch.cancel()
  }, [searchTerm])

  // Memoize individual filter functions
  const searchFilter = useCallback((snippet: Snippet, term: string): boolean => {
    if (!term) return true
    
    const searchTerms = term.toLowerCase().split(/\s+/)
    
    return searchTerms.every(term => {
      // Check if the term exists in our search index
      const titleMatch = snippet.title.toLowerCase().includes(term)
      const descMatch = snippet.description?.toLowerCase().includes(term) ?? false
      const codeMatch = snippet.code.toLowerCase().includes(term)
      const tagMatch = snippet.tags?.some(tag => tag.toLowerCase().includes(term)) ?? false
      
      return titleMatch || descMatch || codeMatch || tagMatch
    })
  }, [])

  const languageFilter = useCallback((snippet: Snippet, language: string): boolean => {
    return language === 'All' || snippet.language === language
  }, [])

  const tagFilter = useCallback((snippet: Snippet, tags: string[]): boolean => {
    if (tags.length === 0) return true
    return tags.every(tag => snippet.tags?.includes(tag))
  }, [])

  // Optimize filteredSnippets with memoized filters
  const filteredSnippets = useMemo(() => {
    const filterStartTime = performance.now()
    console.log('[Performance] Starting snippet filtering...')

    // Apply filters in order of most restrictive first
    let filtered = snippets

    // Apply language filter first (usually most restrictive)
    if (selectedLanguage !== 'All') {
      const langStartTime = performance.now()
      filtered = filtered.filter(snippet => languageFilter(snippet, selectedLanguage))
      console.log(`[Performance] Language filtering took ${(performance.now() - langStartTime).toFixed(2)}ms`)
    }

    // Apply tag filter next
    if (selectedTags.length > 0) {
      const tagStartTime = performance.now()
      filtered = filtered.filter(snippet => tagFilter(snippet, selectedTags))
      console.log(`[Performance] Tag filtering took ${(performance.now() - tagStartTime).toFixed(2)}ms`)
    }

    // Apply search filter last (most expensive)
    if (debouncedSearchTerm) {
      const searchStartTime = performance.now()
      filtered = filtered.filter(snippet => searchFilter(snippet, debouncedSearchTerm))
      console.log(`[Performance] Search filtering took ${(performance.now() - searchStartTime).toFixed(2)}ms`)
    }

    console.log(`[Performance] Total filtering operation took ${(performance.now() - filterStartTime).toFixed(2)}ms`)
    console.log(`[Performance] Filtered to ${filtered.length} snippets`)

    return filtered
  }, [snippets, debouncedSearchTerm, selectedLanguage, selectedTags, searchFilter, languageFilter, tagFilter])

  // Update the search input handler to use controlled input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Track render performance
  useEffect(() => {
    const renderStartTime = performance.now()
    return () => {
      console.log(`[Performance] Component render took ${(performance.now() - renderStartTime).toFixed(2)}ms`)
    }
  })

  // Add copy function with fallback and error handling
  const handleCopy = async (code: string, snippetId: string) => {
    const startTime = performance.now()
    console.log('[Performance] Starting copy operation...')

    try {
      // Check if the Clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }

      // Try using the Clipboard API
      try {
        await navigator.clipboard.writeText(code)
      } catch (clipboardError) {
        console.warn('Clipboard API failed, falling back to execCommand', clipboardError)
        // Fallback to execCommand
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        
        try {
          const successful = document.execCommand('copy')
          if (!successful) {
            throw new Error('execCommand copy failed')
          }
        } finally {
          document.body.removeChild(textarea)
        }
      }

      // Set copied state
      setCopiedId(snippetId)
      setTimeout(() => setCopiedId(null), 2000)
      
      console.log(`[Performance] Copy operation took ${(performance.now() - startTime).toFixed(2)}ms`)
    } catch (err) {
      console.error('[Performance] Copy failed:', err)
      // Show user-friendly error message
      alert('Unable to copy code. Please try selecting and copying manually.')
    }
  }

  // This function is used in the JSX below via button click
  const handleDelete = async (snippetId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this snippet? This action cannot be undone.')
    if (!confirmed) return

    const connection = await getPooledSupabaseClient()
    try {
      const { error } = await connection.client
        .from('snippets')
        .delete()
        .eq('id', snippetId)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      // Update snippets - filtered snippets will update automatically via memo
      const updatedSnippets = snippets.filter(s => s.id !== snippetId)
      setSnippets(updatedSnippets)
      setAvailableTags(getUniqueTags(updatedSnippets))
      setOpenMenuId(null)

    } catch (err) {
      console.error('Error deleting snippet:', err)
      alert('Failed to delete snippet. Please try again.')
    } finally {
      connection.release()
    }
  }

  // Add update handler
  const handleUpdate = (updatedSnippet: Snippet) => {
    setSnippets(prev => 
      prev.map(s => s.id === updatedSnippet.id ? updatedSnippet : s)
    )
  }

  // This function is used in the JSX below via button click
  const handleNewSnippet = () => {
    setIsModalOpen(true)
  }

  // Update handleVote to use indexes efficiently
  const handleVote = async (snippetId: string, voteType: boolean) => {
    if (!profile?.username) {
      return
    }

    const connection = await getPooledSupabaseClient()
    try {
      const { data: { user } } = await connection.client.auth.getUser()
      if (!user) return

      const currentVote = votes[snippetId]?.userVote
      const startTime = performance.now()
      console.log('[Performance] Starting vote operation...')
      console.log('[Performance] Using indexes: snippet_votes_snippet_id_username_key')

      // If clicking the same vote type, remove the vote
      if (currentVote === voteType) {
        const { error } = await connection.client
          .from('snippet_votes')
          .delete()
          .match({
            snippet_id: snippetId,
            username: profile?.username
          })

        if (error) throw error
      } else {
        // If switching votes or voting for the first time, upsert the new vote
        const { error } = await connection.client
          .from('snippet_votes')
          .upsert({
            snippet_id: snippetId,
            username: profile?.username,
            user_id: user.id,
            vote_type: voteType
          }, {
            onConflict: 'snippet_id,username',
            ignoreDuplicates: false
          })

        if (error) throw error
      }

      const queryDuration = performance.now() - startTime
      console.log(`[Performance] Vote operation took ${queryDuration.toFixed(2)}ms`)

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
      console.error('[Performance] Error voting:', err)
    } finally {
      connection.release()
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

  if (loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <div className="text-gray-600">Loading snippets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        onClick={() => {
          setError(null)
          setLoading(true)
          setRetryCount(count => count + 1)
        }}
        className="text-red-500 text-center py-8 cursor-pointer hover:text-red-600"
      >
        <div className="mb-2">{error}</div>
        <button className="px-4 py-2 bg-red-100 rounded-lg text-red-700 hover:bg-red-200 transition-colors">
          Retry Loading
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Left sidebar with filters */}
          <div className="w-56 flex-shrink-0">
            {/* Language Filter */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-600 mb-2">Filter by Language</div>
              <div className="flex flex-col gap-2">
                {availableLanguages.map(language => (
                  <button
                    key={language}
                    onClick={() => setSelectedLanguage(language)}
                    className={`px-3 py-1.5 text-left rounded text-sm font-medium transition-colors
                      ${selectedLanguage === language
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Filter by Tags</div>
                <div className="flex flex-col gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 text-left rounded text-sm font-medium transition-colors
                        ${selectedTags.includes(tag)
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <span className="float-right">×</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6 flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search snippets by title, description, or language..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              {profile?.username && (
                <button
                  onClick={handleNewSnippet}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Snippit
                </button>
              )}
            </div>

            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {filteredSnippets.length > 0 ? (
                filteredSnippets.map(snippet => (
                  <SnippetItem
                    key={snippet.id}
                    snippet={snippet}
                    onCopy={handleCopy}
                    copiedId={copiedId}
                    votes={votes}
                    commentCounts={commentCounts}
                    loadingVotes={loadingVotes}
                    loadingComments={loadingComments}
                    profile={profile}
                    onVote={handleVote}
                    onComment={handleCommentClick}
                    onEdit={setEditingSnippet}
                    onDelete={handleDelete}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                  />
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No snippets found matching your search.
                </div>
              )}
            </div>
          </div>
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
          fetchSnippets()
        }}
      />

      {commentSnippetId && (
        <CommentModal
          snippet={snippets.find(s => s.id === commentSnippetId)!}
          isOpen={true}
          onClose={() => setCommentSnippetId(null)}
          currentUser={profile?.username || null}
          onCommentChange={() => loadCommentCounts()}
        />
      )}
    </>
  )
} 