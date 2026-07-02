'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { adminInviteAdmin } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function InviteAdminDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!clean) return
    startTransition(async () => {
      try {
        await adminInviteAdmin(clean)
        toast.success(`Invitation sent to ${clean}`)
        setOpen(false)
        setEmail('')
      } catch (err) {
        toast.error((err as Error).message || 'Failed to send invitation')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) setOpen(v) }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
          <UserPlus className="h-4 w-4" />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invite Admin</DialogTitle>
          <DialogDescription>
            An invitation email will be sent. The recipient will be registered with the
            ADMIN role automatically when they accept.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-9"
                required
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending
                ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />Sending…</>
                : 'Send invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
