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
    <html lang="en">
      <body className={inter.className}>
        <SessionWrapper session={session}>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-secondary text-secondary-foreground py-4">
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