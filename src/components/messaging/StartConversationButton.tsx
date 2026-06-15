'use client'

import { useTransition } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface StartConversationButtonProps {
  /** A server action (typically bound with the venue/booking id) that redirects to the thread. */
  action: () => Promise<void>
  label: string
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function StartConversationButton({
  action,
  label,
  variant = 'outline',
  className,
}: StartConversationButtonProps) {
  const [isPending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      try {
        await action()
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('NEXT_REDIRECT')) throw err
        toast.error(msg || 'Something went wrong')
      }
    })
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={onClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="me-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
