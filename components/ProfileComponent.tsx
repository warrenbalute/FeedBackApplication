'use client'

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from 'next/link'

interface User {
  id: string;
  name: string;
}

interface Idea {
  id: number;
  idea: string;
  description: string;
  createdAt: string;
  status: string;
  categoryName: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  ideaId: number;
}

export default function ProfileComponent({ user, ideas, comments }: { user: User, ideas: Idea[], comments: Comment[] }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile: {user.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Ideas</CardTitle>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your Comments</CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length > 0 ? (
              <ul className="space-y-2">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-b pb-2">
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      On Idea: {comment.ideaId} | 
                      Created: {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven't made any comments yet.</p>
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
  )
}