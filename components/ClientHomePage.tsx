//app/components/ClientHomePage.tsx

'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import LoginForm from './LoginForm'

export default function ClientHomePage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <LoginForm onLoginSuccess={() => {}} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Welcome to Feedback Space</h1>
      <div className="space-y-4">
        <Link href="/profile">
          <Button>Go to Profile</Button>
        </Link>
        <Link href="/feedback">
          <Button>Go to Feedback</Button>
        </Link>
      </div>
    </div>
  )
}