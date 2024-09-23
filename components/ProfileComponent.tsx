'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from 'next/link'

interface User {
  id: string;
  name: string;
  email: string;
}

interface Idea {
  id: number;
  idea: string;
  description: string;
  userId: string;
  createdAt: string;
  status: string;
  categoryId: number;
  voteCount: number;
  categoryName: string;
}

interface Comment {
  id: number;
  ideaId: number;
  userId: string;
  content: string;
  createdAt: string;
  ideaTitle: string;
}

export default function ProfileComponent({ user }: { user: User }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [ideaPage, setIdeaPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideasEndReached, setIdeasEndReached] = useState(false);
  const [commentsEndReached, setCommentsEndReached] = useState(false);
  const ideasFetchedRef = useRef(false);
  const commentsFetchedRef = useRef(false);

  const fetchIdeas = useCallback(async (page: number) => {
    if (ideasEndReached || loading) return;
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching ideas for page ${page}`);
      const response = await fetch(`/api/user/ideas?page=${page}`);
      console.log('Ideas API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Ideas data received:', data);

      if (Array.isArray(data.ideas)) {
        setIdeas(prevIdeas => [...prevIdeas, ...data.ideas]);
        setIdeaPage(prevPage => prevPage + 1);
        if (data.ideas.length === 0 || data.endReached) {
          setIdeasEndReached(true);
        }
      } else {
        console.error('Unexpected data structure:', data);
        throw new Error('Unexpected data structure from server');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
      setError('Failed to load ideas. Please try again.');
    }
    setLoading(false);
  }, [ideasEndReached, loading]);

  const fetchComments = useCallback(async (page: number) => {
    if (commentsEndReached || loading) return;
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching comments for page ${page}`);
      const response = await fetch(`/api/user/comments?page=${page}`);
      console.log('Comments API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Comments data received:', data);

      if (Array.isArray(data.comments)) {
        setComments(prevComments => [...prevComments, ...data.comments]);
        setCommentPage(prevPage => prevPage + 1);
        if (data.comments.length === 0 || data.endReached) {
          setCommentsEndReached(true);
        }
      } else {
        console.error('Unexpected data structure:', data);
        throw new Error('Unexpected data structure from server');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    }
    setLoading(false);
  }, [commentsEndReached, loading]);

  useEffect(() => {
    if (!ideasFetchedRef.current) {
      ideasFetchedRef.current = true;
      fetchIdeas(1);
    }
  }, [fetchIdeas]);

  useEffect(() => {
    if (!commentsFetchedRef.current) {
      commentsFetchedRef.current = true;
      fetchComments(1);
    }
  }, [fetchComments]);

  const loadMoreIdeas = () => fetchIdeas(ideaPage);
  const loadMoreComments = () => fetchComments(commentPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile: {user.name}</h1>
      <p className="mb-4">Email: {user.email}</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Posted Ideas ({ideas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {ideas.length > 0 ? (
              <ul className="space-y-2">
                {ideas.map((idea) => (
                  <li key={idea.id} className="border-b pb-2">
                    <h3 className="font-semibold">{idea.idea}</h3>
                    <p className="text-sm text-gray-600">{idea.description}</p>
                    <p className="text-xs text-gray-500">
                      Status: {idea.status} | Category: {idea.categoryName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(idea.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven't submitted any ideas yet.</p>
            )}
            {!ideasEndReached && (
              <Button onClick={loadMoreIdeas} disabled={loading} className="mt-4">
                {loading ? 'Loading...' : 'Load More Ideas'}
              </Button>
            )}
            {ideasEndReached && ideas.length > 0 && (
              <p className="mt-4 text-gray-500">No more ideas to load.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Comments to Ideas ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length > 0 ? (
              <ul className="space-y-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-b pb-2">
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      On Idea: {comment.ideaTitle} | 
                      Created: {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven't made any comments yet.</p>
            )}
            {!commentsEndReached && (
              <Button onClick={loadMoreComments} disabled={loading} className="mt-4">
                {loading ? 'Loading...' : 'Load More Comments'}
              </Button>
            )}
            {commentsEndReached && comments.length > 0 && (
              <p className="mt-4 text-gray-500">No more comments to load.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <Link href="/feedback">
          <Button>Go to Feedback</Button>
        </Link>
      </div>
    </div>
  );
}