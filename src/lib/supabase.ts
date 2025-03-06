import { createClient } from '@supabase/supabase-js'

// Create a connection pool configuration
const poolConfig = {
  retryAttempts: 3,  // Number of retry attempts
  retryDelay: 1000,  // Initial delay between retries in ms
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public'
    },
    global: {
      fetch: fetch.bind(globalThis),
      headers: { 'x-my-custom-header': 'my-app-name' }
    },
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true
    }
  }
)

// Define a type for database operation results
interface DbResult<T> {
  data: T | null;
  error: Error | null;
}

// Utility function to handle retries with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  attempt: number = 1
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (attempt >= poolConfig.retryAttempts) {
      throw error
    }
    
    // Calculate delay with exponential backoff
    const delay = poolConfig.retryDelay * Math.pow(2, attempt - 1)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    return withRetry(operation, attempt + 1)
  }
}

// Utility function for database operations with proper connection management
export async function executeQuery<T>(
  operation: () => Promise<DbResult<T>>,
  timeoutMs: number = 30000 // Default timeout of 30s
): Promise<DbResult<T>> {
  const timeoutPromise = new Promise<DbResult<T>>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  })

  try {
    // Convert the Supabase query to a Promise
    const operationPromise = async () => {
      const result = await operation()
      return {
        data: result.data,
        error: result.error
      }
    }

    const result = await Promise.race([
      withRetry(operationPromise),
      timeoutPromise
    ])

    return result
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        console.error('Database connection error:', error)
        return { data: null, error: new Error('Database connection error. Please try again.') }
      }
      if (error.message.includes('timed out')) {
        console.error('Operation timed out:', error)
        return { data: null, error: new Error('Operation timed out. Please try with a smaller update.') }
      }
    }
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') }
  }
}

// Remove temporary console log
// console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL) 