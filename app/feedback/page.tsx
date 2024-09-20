// app/feedback/page.tsx
import { Suspense } from 'react'
import FeedbackApp from '@/components/FeedbackApp'
import { getServerSession } from "next-auth/next"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from 'next/navigation'

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeedbackApp user={session.user} />
    </Suspense>
  )
}