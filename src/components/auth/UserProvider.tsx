'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  id: string
  email: string
  avatar_url?: string | null
  role?: string | null
}

const UserContext = createContext<CurrentUser | null>(null)

/** Current signed-in user, shared app-wide. Seeded on the server so the navbar
 *  paints correctly on first render and stays put across client navigation. */
export function useCurrentUser(): CurrentUser | null {
  return useContext(UserContext)
}

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: CurrentUser | null
  children: ReactNode
}) {
  const [user, setUser] = useState<CurrentUser | null>(initialUser)

  // Keep the context in sync with auth transitions (login via modal, logout)
  // without a full reload. The server-seeded value covers first paint.
  useEffect(() => {
    const supabase = createClient()

    const refresh = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        setUser(null)
        return
      }
      const { data: profile } = await supabase
        .from('users')
        .select('email, avatar_url, role')
        .eq('id', data.user.id)
        .single()
      setUser({
        id: data.user.id,
        email: profile?.email ?? data.user.email ?? '',
        avatar_url: profile?.avatar_url,
        role: profile?.role,
      })
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null)
      else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        void refresh()
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}
