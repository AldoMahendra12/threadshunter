"use client"

import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeletePostButtonClient({ postId }: { postId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to stop monitoring this post and delete it?')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete post')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Could not delete the post. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-500 hover:text-red-400 disabled:opacity-50 transition p-2 rounded-lg hover:bg-red-500/10"
      title="Delete Post"
    >
      <Trash2 className="w-4 h-4" />
      <span>Delete</span>
    </button>
  )
}
