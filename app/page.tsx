// app/page.tsx
import { cookies } from 'next/headers'
import ClientComponent from './ClientComponent'

async function getCurrentUser() {
  const userId = cookies().get('userId')?.value
  const username = cookies().get('username')?.value
  return userId && username ? { id: userId, username } : null
}

export default async function Page() {
  const initialUser = await getCurrentUser()
  return <ClientComponent initialUser={initialUser} />
}