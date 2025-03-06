'use client'

import { useState } from 'react'
import { getPooledSupabaseClient } from '@/context/AuthContext'

interface ProfileData {
  username: string
  name: string
  email: string
}

export default function ProfileInfo({ profile }: { profile: ProfileData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: profile.username,
    name: profile.name
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const connection = await getPooledSupabaseClient()
    try {
      const { error: updateError } = await connection.client
        .from('profiles')
        .update({
          username: formData.username,
          name: formData.name
        })
        .eq('email', profile.email)

      if (updateError) throw updateError

      setIsEditing(false)
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
      connection.release()
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
            required
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <p className="mt-1 text-gray-900">{profile.username}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <p className="mt-1 text-gray-900">{profile.name}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <p className="mt-1 text-gray-900">{profile.email}</p>
      </div>

      <button
        onClick={() => setIsEditing(true)}
        className="bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
      >
        Edit Profile
      </button>
    </div>
  )
} 