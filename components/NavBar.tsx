//app/components/NavBar.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"

export default function NavBar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="text-lg font-bold">
         UAM BizOps Feedback Space
        </Link>
        {status === 'authenticated' ? (
          <div className="space-x-4">
            <Link 
              href="/profile" 
              className={`hover:text-secondary-foreground transition-colors ${pathname === '/profile' ? 'font-bold' : ''}`}
            >
              Profile
            </Link>
            <Link 
              href="/feedback" 
              className={`hover:text-secondary-foreground transition-colors ${pathname === '/feedback' ? 'font-bold' : ''}`}
            >
              Feedback
            </Link>
            <Button 
              onClick={() => signOut()} 
              variant="ghost"
              className="hover:text-secondary-foreground transition-colors"
            >
              Sign Out
            </Button>
          </div>
        ) : null}
      </nav>
    </header>
  )
}