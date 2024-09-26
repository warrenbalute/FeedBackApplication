//app/layout.tsx

import './globals.css'
import { Inter } from 'next/font/google'
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"
import NavBar from '@/components/NavBar'
import SessionWrapper from '@/components/SessionWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Feedback Space',
  description: 'A place to share and discuss ideas',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <SessionWrapper session={session}>
          <div className="min-h-screen flex flex-col">
            <NavBar className="fixed top-0 left-0 right-0 z-50" />
            <main className="flex-grow mt-16 mb-16">
              {children}
            </main>
            <footer className="bg-secondary text-secondary-foreground py-4 fixed bottom-0 left-0 right-0 z-50">
              <div className="container mx-auto px-4 text-center">
                © {new Date().getFullYear()} Feedback Space. All rights reserved.
              </div>
            </footer>
          </div>
        </SessionWrapper>
      </body>
    </html>
  )
}
