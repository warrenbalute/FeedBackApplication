//app/profile/page.tsx

import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import ProfileComponent from "@/components/ProfileComponent"
import { getUserIdeas, getUserComments } from "@/app/actions"


 interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
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

// export default async function ProfilePage() {
//   const session = await getServerSession(authOptions)

//   if (!session) {
//     redirect("/login")
//   }

//   // const ideas = await getUserIdeas(session.user.id)
//   // const comments = await getUserComments(session.user.id)

//   const [ideas, comments] = await Promise.all([
//     getUserIdeas(session.user.id),
//     getUserComments(session.user.id)
//   ])

//   console.log('Fetched ideas:', ideas)
//   console.log('Fetched comments:', comments)

//   //return <ProfileComponent user={session.user} ideas={ideas} comments={comments} />

//   return <ProfileComponent user={session.user} ideas={ideas} comments={comments} />
// }

// Define a type for the session user that matches what NextAuth provides
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profilePictureUrl?: string;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  const sessionUser = session.user as SessionUser

  const user: User = {
    id: sessionUser.id,
    name: sessionUser.name || 'Anonymous',
    email: sessionUser.email || 'No email provided',
    image: sessionUser.image || undefined,
    profilePictureUrl: sessionUser.profilePictureUrl
  }

  const [ideas, comments] = await Promise.all([
    getUserIdeas(user.id),
    getUserComments(user.id)
  ])

  console.log('Fetched ideas:', ideas)
  console.log('Fetched comments:', comments)

  return <ProfileComponent user={user} initialIdeas={ideas as Idea[]} initialComments={comments as Comment[]} />
}