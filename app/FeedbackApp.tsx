// app/FeedbackApp.tsx
'use client'

import { useState, useEffect } from 'react'
import { addIdea, getIdeas, logout, vote } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown } from 'lucide-react'

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
  votes: number;
  voteCount: bigint;
}

export default function FeedbackApp({ user }: { user: User }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    setIsLoading(true)
    try {
      const fetchedIdeas = await getIdeas()
      console.log('Fetched ideas in component:', fetchedIdeas);
      setIdeas(fetchedIdeas)
    } catch (error) {
      console.error('Failed to fetch ideas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (newIdea.trim()) {
      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('idea', newIdea)
        formData.append('description', newDescription)
        const updatedIdeas = await addIdea(formData)
        setIdeas(updatedIdeas)
        setNewIdea('')
        setNewDescription('')
      } catch (error) {
        console.error('Failed to add idea:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  async function handleVote(ideaId: number, action: 'vote' | 'unvote') {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('action', action)
      const updatedIdeas = await vote(formData)
      setIdeas(updatedIdeas)
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      window.location.reload()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg">Welcome, {user.username}!</p>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <Input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Enter your idea"
          className="w-full"
          disabled={isLoading}
        />
        <Textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Enter your idea description"
          className="w-full"
          disabled={isLoading}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Idea'}
        </Button>
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
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(idea.id, 'vote')}
                  disabled={isLoading}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Vote
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(idea.id, 'unvote')}
                  disabled={isLoading}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  Unvote
                </Button>
              </div>
              <span className="font-bold">Votes: {Number(idea.voteCount)}</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}