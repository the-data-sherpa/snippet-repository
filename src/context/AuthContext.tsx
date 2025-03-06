'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Connection pool configuration
const POOL_CONFIG = {
  MAX_CONNECTIONS: 20,
  MIN_CONNECTIONS: 5,
  IDLE_TIMEOUT: 10000, // 10 seconds
}

// Connection pool state
interface ConnectionPool {
  activeConnections: number
  idleConnections: Set<number>
  lastConnectionId: number
}

const connectionPool: ConnectionPool = {
  activeConnections: 0,
  idleConnections: new Set(),
  lastConnectionId: 0,
}

// Connection management functions
const acquireConnection = async () => {
  if (connectionPool.idleConnections.size > 0) {
    const iterator = connectionPool.idleConnections.values()
    const firstValue = iterator.next()
    if (!firstValue.done) {
      const connectionId = firstValue.value
      connectionPool.idleConnections.delete(connectionId)
      connectionPool.activeConnections++
      return connectionId
    }
  }

  if (connectionPool.activeConnections < POOL_CONFIG.MAX_CONNECTIONS) {
    connectionPool.lastConnectionId++
    connectionPool.activeConnections++
    return connectionPool.lastConnectionId
  }

  // Wait for an available connection
  return new Promise<number>((resolve) => {
    const checkAvailability = setInterval(() => {
      if (connectionPool.idleConnections.size > 0) {
        clearInterval(checkAvailability)
        const iterator = connectionPool.idleConnections.values()
        const firstValue = iterator.next()
        if (!firstValue.done) {
          const connectionId = firstValue.value
          connectionPool.idleConnections.delete(connectionId)
          connectionPool.activeConnections++
          resolve(connectionId)
        }
      }
    }, 100)
  })
}

const releaseConnection = (connectionId: number) => {
  connectionPool.activeConnections--
  connectionPool.idleConnections.add(connectionId)

  // Clean up idle connections after timeout
  setTimeout(() => {
    if (connectionPool.idleConnections.has(connectionId) && 
        connectionPool.idleConnections.size > POOL_CONFIG.MIN_CONNECTIONS) {
      connectionPool.idleConnections.delete(connectionId)
    }
  }, POOL_CONFIG.IDLE_TIMEOUT)
}

// Export the connection pooling function
export const getPooledSupabaseClient = async () => {
  const connectionId = await acquireConnection()
  return {
    client: supabase,
    release: () => releaseConnection(connectionId)
  }
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: { username: string; name: string; email: string } | null
  loading: boolean
  error: string | null
  connectionStats: {
    active: number
    idle: number
    total: number
  }
}

interface AuthContextType extends AuthState {
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
    connectionStats: {
      active: 0,
      idle: 0,
      total: 0
    }
  })
  const router = useRouter()

  const refreshAuth = async () => {
    const connection = await getPooledSupabaseClient()
    try {
      // Get both user and session data
      const [
        { data: { user }, error: userError },
        { data: { session }, error: sessionError }
      ] = await Promise.all([
        connection.client.auth.getUser(),
        connection.client.auth.getSession()
      ])
      
      if (userError) throw userError
      if (sessionError) throw sessionError

      if (!user) {
        setAuthState(prev => ({
          ...prev,
          user: null,
          session: null,
          profile: null,
          loading: false,
          connectionStats: {
            active: connectionPool.activeConnections,
            idle: connectionPool.idleConnections.size,
            total: connectionPool.lastConnectionId
          }
        }))
        return
      }

      // Get user's profile if user exists
      const { data: profile, error: profileError } = await connection.client
        .from('profiles')
        .select('username, name, email')
        .eq('email', user.email)
        .single()

      if (profileError) throw profileError

      setAuthState({
        user,
        session,
        profile,
        loading: false,
        error: null,
        connectionStats: {
          active: connectionPool.activeConnections,
          idle: connectionPool.idleConnections.size,
          total: connectionPool.lastConnectionId
        }
      })
    } catch (err) {
      console.error('Auth refresh error:', err)
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Authentication error',
        loading: false,
        connectionStats: {
          active: connectionPool.activeConnections,
          idle: connectionPool.idleConnections.size,
          total: connectionPool.lastConnectionId
        }
      }))
    } finally {
      connection.release()
    }
  }

  const signOut = async () => {
    const connection = await getPooledSupabaseClient()
    try {
      const { error } = await connection.client.auth.signOut()
      if (error) throw error
      
      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
        connectionStats: {
          active: connectionPool.activeConnections,
          idle: connectionPool.idleConnections.size,
          total: connectionPool.lastConnectionId
        }
      })
      
      router.push('/signin')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
      setAuthState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error signing out',
        connectionStats: {
          active: connectionPool.activeConnections,
          idle: connectionPool.idleConnections.size,
          total: connectionPool.lastConnectionId
        }
      }))
    } finally {
      connection.release()
    }
  }

  // Initialize connection pool and check auth state
  useEffect(() => {
    // Pre-warm the connection pool
    for (let i = 0; i < POOL_CONFIG.MIN_CONNECTIONS; i++) {
      connectionPool.lastConnectionId++
      connectionPool.idleConnections.add(connectionPool.lastConnectionId)
    }

    // Initial auth check
    const checkInitialAuth = async () => {
      const connection = await getPooledSupabaseClient()
      try {
        const [
          { data: { user }, error: userError },
          { data: { session }, error: sessionError }
        ] = await Promise.all([
          connection.client.auth.getUser(),
          connection.client.auth.getSession()
        ])

        if (userError || sessionError) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: userError?.message || sessionError?.message || 'Authentication error'
          }))
          return
        }

        if (!user) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            user: null,
            session: null,
            profile: null
          }))
          return
        }

        // Get user's profile if user exists
        const { data: profile, error: profileError } = await connection.client
          .from('profiles')
          .select('username, name, email')
          .eq('email', user.email)
          .single()

        setAuthState({
          user,
          session,
          profile: profileError ? null : profile,
          loading: false,
          error: profileError ? profileError.message : null,
          connectionStats: {
            active: connectionPool.activeConnections,
            idle: connectionPool.idleConnections.size,
            total: connectionPool.lastConnectionId
          }
        })
      } catch (err) {
        console.error('Initial auth check error:', err)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Authentication error'
        }))
      } finally {
        connection.release()
      }
    }

    // Run initial auth check
    checkInitialAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      console.log('Auth state change:', event)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshAuth()
        router.refresh()
      }
      if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          error: null,
          connectionStats: {
            active: connectionPool.activeConnections,
            idle: connectionPool.idleConnections.size,
            total: connectionPool.lastConnectionId
          }
        })
        router.push('/signin')
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
      // Clean up connection pool on unmount
      connectionPool.idleConnections.clear()
      connectionPool.activeConnections = 0
      connectionPool.lastConnectionId = 0
    }
  }, [router])

  const value = {
    ...authState,
    refreshAuth,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 