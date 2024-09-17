'use client'

import { useState, useEffect } from 'react'
import { addIdea, getIdeas, logout, vote, updateStatus, addComment, getComments, getCategories } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown } from 'lucide-react'

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
  status: 'waiting' | 'in_progress' | 'done';
  categoryId: number;
  categoryName: string;
}

interface Comment {
  id: number;
  ideaId: number;
  userId: string;
  content: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

const statusColors = {
  waiting: 'bg-yellow-100',
  in_progress: 'bg-blue-100',
  done: 'bg-green-100',
};

const statusLabels: Record<string, string> = {
  all: 'All Ideas',
  waiting: 'Waiting',
  in_progress: 'In Progress',
  done: 'Done',
};

type StatusFilter = 'all' | 'waiting' | 'in_progress' | 'done';

export default function FeedbackApp({ user }: { user: User }) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [newComments, setNewComments] = useState<{ [key: number]: string }>({})
  const [openComments, setOpenComments] = useState<number | null>(null)
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    fetchIdeas()
    fetchCategories()
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

  async function fetchCategories() {
    try {
      const fetchedCategories = await getCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (newIdea.trim() && newCategory) {
      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('idea', newIdea)
        formData.append('description', newDescription)
        formData.append('categoryId', newCategory)
        const updatedIdeas = await addIdea(formData)
        setIdeas(updatedIdeas)
        setNewIdea('')
        setNewDescription('')
        setNewCategory('')
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

  async function handleStatusChange(ideaId: number, newStatus: 'waiting' | 'in_progress' | 'done') {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('status', newStatus)
      const updatedIdeas = await updateStatus(formData)
      setIdeas(updatedIdeas)
    } catch (error) {
      console.error('Failed to update status:', error)
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

  async function handleCommentSubmit(ideaId: number) {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('content', newComments[ideaId] || '')
      const updatedComments = await addComment(formData)
      setComments(prev => ({ ...prev, [ideaId]: updatedComments }))
      setNewComments(prev => ({ ...prev, [ideaId]: '' }))
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchComments(ideaId: number) {
    setIsLoading(true)
    try {
      const fetchedComments = await getComments(ideaId)
      setComments(prev => ({ ...prev, [ideaId]: fetchedComments }))
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleComments(ideaId: number) {
    if (openComments === ideaId) {
      setOpenComments(null)
    } else {
      setOpenComments(ideaId)
      if (!comments[ideaId]) {
        fetchComments(ideaId)
      }
    }
  }

  const filteredIdeas = activeStatus === 'all' ? ideas : ideas.filter(idea => idea.status === activeStatus)

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
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isLoading}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id.toString()}>
              {category.name}
            </option>
          ))}
        </select>
        <Button type="submit" className="w-full" disabled={isLoading || !newCategory}>
          {isLoading ? 'Submitting...' : 'Submit Idea'}
        </Button>
      </form>
      <div className="mb-4">
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value as StatusFilter)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filteredIdeas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            user={user}
            handleVote={handleVote}
            handleStatusChange={handleStatusChange}
            toggleComments={toggleComments}
            openComments={openComments}
            comments={comments[idea.id] || []}
            newComment={newComments[idea.id] || ''}
            setNewComment={(comment) => setNewComments(prev => ({ ...prev, [idea.id]: comment }))}
            handleCommentSubmit={handleCommentSubmit}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}

function IdeaCard({ idea, user, handleVote, handleStatusChange, toggleComments, openComments, comments, newComment, setNewComment, handleCommentSubmit, isLoading }) {
  return (
    <Card key={idea.id} className={`${statusColors[idea.status]} transition-colors duration-200`}>
      <CardHeader>
        <CardTitle>{idea.idea}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2">{idea.description}</p>
        <p className="text-sm text-gray-500">Posted by: {idea.userId}</p>
        <p className="text-sm text-gray-500">
          Posted on: {new Date(idea.createdAt).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">Category: {idea.categoryName}</p>
        {idea.userId === user.id ? (
          <div className="mt-2 flex items-center">
            <label htmlFor={`status-${idea.id}`} className="sr-only">
              Change Status
            </label>
            <div className="relative inline-block w-40">
              <select
                id={`status-${idea.id}`}
                value={idea.status}
                onChange={(e) => handleStatusChange(idea.id, e.target.value as 'waiting' | 'in_progress' | 'done')}
                className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                disabled={isLoading}
              >
                <option value="waiting">Waiting</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium">Status: {statusLabels[idea.status]}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-4">
        <div className="flex justify-between items-center w-full">
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
          </div>
          <span className="font-bold">Votes: {Number(idea.voteCount)}</span>
        </div>
        <div className="w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleComments(idea.id)}
            className="w-full justify-center"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {openComments === idea.id ? 'Hide Comments' : 'Show Comments'}
          </Button>
          {openComments === idea.id && (
            <div className="mt-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By: {comment.userId} on {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-grow"
                />
                <Button
                  onClick={() => handleCommentSubmit(idea.id)}
                  disabled={isLoading || !newComment}
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}