//app/components/NavBar.tsx

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import Image, { StaticImageData } from 'next/image'
import { useState, useEffect } from 'react'
import { useCustomSession } from '@/hooks/useCustomSession'

interface NavBarProps {
  className?: string;
}

export default function NavBar({ className = '' }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, status } = useCustomSession()

  const handleProfileClick = () => {
    router.push('/profile')
  }

  return (
    <header className={`bg-primary text-primary-foreground shadow-md ${className}`}>
      <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/feedback" className="text-lg font-bold">
          UAM BizOps Feedback Space
        </Link>
        {status === 'authenticated' && session?.user ? (
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleProfileClick}
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-primary-foreground rounded-full py-1 px-2 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center overflow-hidden">
                {session.user.image ? (
                  <Image 
                    src={session.user.image}
                    alt={session.user.name || 'Profile picture'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {session.user.name ? session.user.name[0].toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <span className="font-medium">{session.user.name}</span>
            </Button>
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