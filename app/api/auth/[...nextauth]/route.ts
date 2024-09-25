//app/api/auth/[...nextauth]/route.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authenticateWithLDAP } from "@/lib/db"
import { initializeDatabase } from "@/lib/initDb"
import { cookies } from 'next/headers'

// Initialize the database
initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error)
  process.exit(1) // Exit the process if database initialization fails
})

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      profilePictureUrl?: string;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    profilePictureUrl?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        console.log('Attempting to authenticate with LDAP')
        const result = await authenticateWithLDAP(credentials.username, credentials.password)
        console.log('LDAP authentication result:', result)

        if (result.success && result.user) {
          return {
            id: result.user.id,
            name: result.user.username,
            email: `${result.user.username}@example.com`, // Adjust as needed
            profilePictureUrl: result.user.profilePictureUrl
          }
        } else {
          console.log('Authentication failed')
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (user) {
        // Set the userId cookie
        cookies().set('userId', user.id)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.profilePictureUrl = user.profilePictureUrl;
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.profilePictureUrl = token.profilePictureUrl as string;
        
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }