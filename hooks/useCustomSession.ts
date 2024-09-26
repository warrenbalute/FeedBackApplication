import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'

export function useCustomSession() {
  const { data: sessionData, status, update } = useSession()
  const [session, setSession] = useState(sessionData)

  useEffect(() => {
    setSession(sessionData)
  }, [sessionData])

  const updateSession = useCallback(async (newData: any) => {
    const updatedSession = await update(newData)
    setSession(updatedSession)
    return updatedSession
  }, [update])

  return { session, status, updateSession }
}