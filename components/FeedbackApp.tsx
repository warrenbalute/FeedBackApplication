//app/components/FeedbackApp.tsx


'use client'

import { useState, useEffect } from 'react'
import { addIdea, vote, getIdeas, updateStatus, addComment, getComments, getCategories } from '@/app/actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, ThumbsDown, MessageCircle, ChevronDown, MoreHorizontal } from 'lucide-react'
import { IdeaStats, StatusFilter } from './IdeaStats'

interface User {
  id: string;
  name: string;
}

interface Idea {
  id: number;
  idea: string;
  description: string;
  userId: string;
  createdAt: string;
  voteCount: number;
  status: 'waiting' | 'in_progress' | 'done';
  categoryId: number;
  categoryName: string;
  commentCount: number;
  userVote: 'upvote' | 'downvote' | null;
  userHasVoted: boolean;
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

//type StatusFilter = 'all' | 'waiting' | 'in_progress' | 'done';

interface IdeaCardProps {
  idea: Idea;
  user: User;
  handleVote: (ideaId: number, action: 'vote' | 'unvote') => Promise<void>;
  handleStatusChange: (ideaId: number, newStatus: 'waiting' | 'in_progress' | 'done') => Promise<void>;
  toggleComments: (ideaId: number) => void;
  openComments: number | null;
  comments: Comment[];
  newComment: string;
  setNewComment: (comment: string) => void;
  handleCommentSubmit: (ideaId: number) => Promise<void>;
  isLoading: boolean;
  isVoting: boolean;
}

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
  const [error, setError] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState<{ [key: number]: boolean }>({})
  

  useEffect(() => {
    fetchIdeas()
    fetchCategories()
  }, [])

  async function fetchIdeas() {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedIdeas = await getIdeas()
      setIdeas(fetchedIdeas)
    } catch (error) {
      console.error('Error fetching ideas:', error)
      setError('Failed to fetch ideas. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const fetchedCategories = await getCategories()
      if (Array.isArray(fetchedCategories)) {
        setCategories(fetchedCategories)
      } else {
        console.error('Fetched categories is not an array:', fetchedCategories)
        setCategories([])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (newIdea.trim() && newCategory) {
      setIsLoading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('idea', newIdea)
        formData.append('description', newDescription)
        formData.append('categoryId', newCategory)
        formData.append('userId', user.id)
        const updatedIdeas = await addIdea(formData)
        setIdeas(updatedIdeas)
        setNewIdea('')
        setNewDescription('')
        setNewCategory('')
      } catch (error) {
        console.error('Failed to add idea:', error)
        setError('Failed to add idea. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  async function handleVote(ideaId: number, action: 'vote' | 'unvote') {
    setIsVoting(prev => ({ ...prev, [ideaId]: true }))
    setError(null)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('action', action)
      const updatedIdeas = await vote(formData)
      setIdeas(updatedIdeas)
    } catch (error) {
      console.error('Failed to vote:', error)
      setError('Failed to vote. Please try again.')
    } finally {
      setIsVoting(prev => ({ ...prev, [ideaId]: false }))
    }
  }

  async function handleStatusChange(ideaId: number, newStatus: 'waiting' | 'in_progress' | 'done') {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('status', newStatus)
      const updatedIdeas = await updateStatus(formData)
      if (Array.isArray(updatedIdeas)) {
        setIdeas(updatedIdeas)
      } else {
        console.error('Updated ideas after status change is not an array:', updatedIdeas)
        setError('Failed to update status. Please try again.')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      setError('Failed to update status. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCommentSubmit(ideaId: number) {
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('ideaId', ideaId.toString())
      formData.append('content', newComments[ideaId] || '')
      formData.append('userId', user.id)
      const updatedComments = await addComment(formData)
      if (Array.isArray(updatedComments)) {
        setComments(prev => ({ ...prev, [ideaId]: updatedComments }))
        setNewComments(prev => ({ ...prev, [ideaId]: '' }))
      } else {
        console.error('Updated comments is not an array:', updatedComments)
        setError('Failed to add comment. Please try again.')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      setError('Failed to add comment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchComments(ideaId: number) {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedComments = await getComments(ideaId)
      if (Array.isArray(fetchedComments)) {
        setComments(prev => ({ ...prev, [ideaId]: fetchedComments }))
      } else {
        console.error('Fetched comments is not an array:', fetchedComments)
        setError('Failed to fetch comments. Please try again.')
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      setError('Failed to fetch comments. Please try again.')
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

  //const filteredIdeas = activeStatus === 'all' ? ideas : ideas.filter(idea => idea.status === activeStatus)
  const filteredIdeas = activeStatus === 'all' ? ideas : ideas.filter(idea => idea.status === activeStatus);

  const ideaStats = {
    totalIdeas: ideas.length,
    waitingIdeas: ideas.filter(idea => idea.status === 'waiting').length,
    inProgressIdeas: ideas.filter(idea => idea.status === 'in_progress').length,
    doneIdeas: ideas.filter(idea => idea.status === 'done').length,
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white sticky top-16 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold">Welcome, {user.name}!</p>
          </div>
          <p className="text-sm mb-4">Please share your ideas here - it helps us improve. Thank you!</p>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
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
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full" disabled={isLoading || !newCategory}>
              {isLoading ? 'Submitting...' : 'Submit Idea'}
            </Button>
          </form>
        </div>
        <div className="container mx-auto max-w-4xl">
        <IdeaStats
          {...ideaStats}
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
        />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="container mx-auto max-w-4xl space-y-4 p-4">
          {Array.isArray(filteredIdeas) && filteredIdeas.map((idea) => (
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
              isVoting={isVoting[idea.id]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

  function IdeaCard({
    idea,
    user,
    handleVote,
    handleStatusChange,
    toggleComments,
    openComments,
    comments,
    newComment,
    setNewComment,
    handleCommentSubmit,
    isLoading,
    isVoting
  }: IdeaCardProps){
    const [showDetails, setShowDetails] = useState(false)
    return (
      <Card className={`${statusColors[idea.status]} transition-colors duration-200`}>
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium truncate">{idea.idea}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {showDetails && (
          <CardContent className="p-3 pt-0">
            <p className="text-sm mb-2">{idea.description}</p>
            <p className="text-xs text-gray-500">Posted by: {idea.userId}</p>
            <p className="text-xs text-gray-500">
              Posted on: {new Date(idea.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Category: {idea.categoryName}</p>
            {idea.userId === user.id && (
              <div className="mt-2 flex items-center">
                <label htmlFor={`status-${idea.id}`} className="sr-only">
                  Change Status
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    id={`status-${idea.id}`}
                    value={idea.status}
                    onChange={(e) => handleStatusChange(idea.id, e.target.value as 'waiting' | 'in_progress' | 'done')}
                    className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-1 px-2 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
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
            )}
          </CardContent>
        )}
        <CardFooter className="p-3 pt-0 flex flex-col items-start space-y-2">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2">
              <Button
                variant={idea.userHasVoted ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleVote(idea.id, idea.userHasVoted ? 'unvote' : 'vote')}
                disabled={isVoting}
              >
                {idea.userHasVoted ? (
                  <ThumbsDown className="mr-1 h-3 w-3" />
                ) : (
                  <ThumbsUp className="mr-1 h-3 w-3" />
                )}
                <span className="text-xs">{idea.userHasVoted ? 'Unvote' : 'Vote'}</span>
              </Button>
              <span className="text-sm font-bold">Votes: {Number(idea.voteCount)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleComments(idea.id)}
              className="text-xs"
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              {idea.commentCount}
            </Button>
          </div>
          {openComments === idea.id && (
            <div className="w-full mt-2 space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-100 p-2 rounded-md text-xs">
                  <p>{comment.content}</p>
                  <p className="text-gray-500 mt-1">
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
                  className="flex-grow text-xs"
                />
                <Button
                  onClick={() => handleCommentSubmit(idea.id)}
                  disabled={isLoading || !newComment}
                  size="sm"
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    )
}