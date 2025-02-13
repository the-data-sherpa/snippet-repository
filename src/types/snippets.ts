export type Profile = {
  id: string
  username: string
  name: string | null
  email: string
  created_at: string
}

export type Snippet = {
  id: string
  created_at: string
  title: string
  description: string | null
  code: string
  language: string
  tags: string[]
  username: string
} 