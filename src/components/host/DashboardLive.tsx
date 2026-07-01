'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Zero-UI component that subscribes to Supabase Realtime and calls
 * router.refresh() whenever bookings, messages, reviews, or notifications
 * change — keeping the Server Component dashboard in sync without polling.
 *
 * Debounced to 1 second so a burst of changes fires only one refresh.
 */
export function DashboardLive() {
  const router   = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const refresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => router.refresh(), 1000)
    }

    const channels = [
      supabase
        .channel('dashboard-bookings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, refresh)
        .subscribe(),
      supabase
        .channel('dashboard-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
        .subscribe(),
      supabase
        .channel('dashboard-reviews')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, refresh)
        .subscribe(),
      supabase
        .channel('dashboard-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, refresh)
        .subscribe(),
    ]

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [router])

  return null
}
