// app/FeedbackApp.tsx
'use client'

import { useState, useEffect } from 'react'
import { addIdea, getIdeas, logout } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface User {
  id: string;
  username: string;
}

interface Idea {
  id: number;
  idea: string;
  description: string;
  userId: string;
  createdAt: string;
}

export default function FeedbackApp({ user }: { user: User }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    const fetchedIdeas = await getIdeas()
    setIdeas(fetchedIdeas)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (newIdea.trim()) {
      const formData = new FormData()
      formData.append('idea', newIdea)
      formData.append('description', newDescription)
      const updatedIdeas = await addIdea(formData)
      setIdeas(updatedIdeas)
      setNewIdea('')
      setNewDescription('')
    }
  }

  async function handleLogout() {
    await logout()
    window.location.reload()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p>Welcome, {user.username}!</p>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <Input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Enter your idea"
          className="w-full"
        />
        <Textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Enter your idea description"
          className="w-full"
        />
        <Button type="submit" className="w-full">Submit Idea</Button>
      </form>
      <div className="space-y-4">
        {ideas.map((idea) => (
          <Card key={idea.id}>
            <CardHeader>
              <CardTitle>{idea.idea}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{idea.description}</p>
              <p className="text-sm text-gray-500">Posted by: {idea.userId}</p>
              <p className="text-sm text-gray-500">
                Posted on: {new Date(idea.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}