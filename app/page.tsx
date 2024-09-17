// app/page.tsx
import { getCurrentUser } from './actions'
import FeedbackApp from './FeedbackApp'
import LoginForm from './LoginForm'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Feedback Application</h1>
      {user ? <FeedbackApp user={user} /> : <LoginForm />}
    </main>
  )
}