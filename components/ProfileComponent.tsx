//components/ProfileComponents.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { CameraIcon } from 'lucide-react'

interface User {
  id: string;
  name: string;
  email: string;
  profilePictureUrl?: string;
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
  const { data: session, update: updateSession } = useSession()
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
  const [profilePicture, setProfilePicture] = useState<string | null>(user.profilePictureUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfilePicture(data.profilePictureUrl);
      
      // Update the session with the new profile picture URL
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          profilePictureUrl: data.profilePictureUrl
        }
      })
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <div className="relative w-16 h-16 mr-4">
          <button
            onClick={handleProfilePictureClick}
            className="w-full h-full rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Change profile picture"
          >
            {profilePicture ? (
              <div className="relative w-full h-full group">
                <Image 
                  src={profilePicture} 
                  alt="Profile" 
                  layout="fill" 
                  objectFit="cover" 
                  className="rounded-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center group">
                <span className="text-gray-500 text-2xl group-hover:opacity-50 transition-opacity">{user.name[0]}</span>
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isUploading && <p className="text-blue-500 mb-4">Uploading profile picture...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Ideas ({ideas.length})</CardTitle>
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
                Load More Ideas
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Comments ({comments.length})</CardTitle>
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
                Load More Comments
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/feedback">
          <Button>Go to Feedback</Button>
        </Link>
      </div>
    </div>
  );
}