import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import ProfileComponent from "@/components/ProfileComponent"
import { getUserIdeas, getUserComments } from "@/app/actions"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const ideas = await getUserIdeas(session.user.id)
  const comments = await getUserComments(session.user.id)

  return <ProfileComponent user={session.user} ideas={ideas} comments={comments} />
}