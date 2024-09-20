import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "./api/auth/[...nextauth]/route"
import LoginForm from "@/components/LoginForm"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/profile')
  }

  return <LoginForm />
}