import { getPooledSupabaseClient } from '@/context/AuthContext'

export async function updateUsername(newUsername: string) {
  const connection = await getPooledSupabaseClient()
  try {
    // Get current user
    const { data: { user }, error: userError } = await connection.client.auth.getUser()
    if (userError) throw userError
    if (!user || !user.email) throw new Error('User not authenticated or missing email')

    // Get current profile
    const { data: profile, error: profileError } = await connection.client
      .from('profiles')
      .select('id, username')
      .eq('email', user.email)
      .single()
    
    if (profileError) throw profileError

    // Update the username
    const { error: updateError } = await connection.client
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', profile.id)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error updating username:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update username'
    }
  } finally {
    connection.release()
  }
} 