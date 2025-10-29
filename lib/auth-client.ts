"use client"

import { useEffect, useState, useCallback } from "react"

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Session {
  user?: User
  expires: string
}

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  const fetchSession = useCallback(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setSession(data)
          setStatus("authenticated")
        } else {
          setSession(null)
          setStatus("unauthenticated")
        }
      })
      .catch(() => {
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return { data: session, status, refetch: fetchSession }
}

