//app/components/NavBar.tsx

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"

// export default function NavBar() {
//   const pathname = usePathname()
//   const { data: session, status } = useSession()

//   return (
//     <header className="bg-primary text-primary-foreground shadow-md">
//       <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
//         <Link href="/" className="text-lg font-bold">
//          UAM BizOps Feedback Space
//         </Link>
//         {status === 'authenticated' ? (
//           <div className="space-x-4">
//             <Link 
//               href="/profile" 
//               className={`hover:text-secondary-foreground transition-colors ${pathname === '/profile' ? 'font-bold' : ''}`}
//             >
//               Profile
//             </Link>
//             <Link 
//               href="/feedback" 
//               className={`hover:text-secondary-foreground transition-colors ${pathname === '/feedback' ? 'font-bold' : ''}`}
//             >
//               Feedback
//             </Link>
//             <Button 
//               onClick={() => signOut()} 
//               variant="ghost"
//               className="hover:text-secondary-foreground transition-colors"
//             >
//               Sign Out
//             </Button>
//           </div>
//         ) : null}
//       </nav>
//     </header>
//   )
// }


export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleProfileClick = () => {
    router.push('/profile')
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/feedback" className="text-lg font-bold">
          UAM BizOps Feedback Space
        </Link>
        {status === 'authenticated' && session?.user ? (
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleProfileClick}
              className="flex items-center space-x-2 bg-transparent hover:bg-primary-foreground hover:bg-opacity-10 rounded-full py-1 px-2 transition-colors duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center overflow-hidden">
                {session.user.profilePictureUrl ? (
                  <img 
                    src={session.user.profilePictureUrl} 
                    alt={session.user.name || ''} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {session.user.name ? session.user.name[0].toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <span className="font-medium">{session.user.name}</span>
            </button>
            <div className="relative group">
              <button className="p-1 rounded-full hover:bg-primary-foreground hover:bg-opacity-10 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link 
                  href="/feedback" 
                  className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  Feedback
                </Link>
                <button 
                  onClick={() => signOut()} 
                  className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  )
}