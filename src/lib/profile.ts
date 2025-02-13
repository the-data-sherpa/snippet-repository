import { supabase } from './supabase'

export async function updateUsername(newUsername: string) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('email', user.email)
      .single()
    
    if (profileError) throw profileError

    // Update the username
    const { error: updateError } = await supabase
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
  }
} 