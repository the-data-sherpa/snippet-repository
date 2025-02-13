export type UsernameHistory = {
  id: string
  old_username: string
  new_username: string
  changed_at: string
  profile_id: string
}

export type Profile = {
  id: string
  username: string
  name: string | null
  email: string
  created_at: string
} 