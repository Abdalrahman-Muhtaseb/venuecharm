'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, Eye, ShieldCheck, ShieldOff, Ban, UserCheck, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminToggleVerified, adminBanUser, adminUnbanUser } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type PendingAction =
  | { kind: 'verify'; value: boolean }
  | { kind: 'ban';    value: boolean }
  | null

interface Props {
  userId: string
  isVerified: boolean
  isBanned: boolean
}

export function AdminUserActionsDropdown({ userId, isVerified, isBanned }: Props) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleConfirm() {
    if (!pending) return
    startTransition(async () => {
      try {
        if (pending.kind === 'verify') {
          await adminToggleVerified(userId, pending.value)
          toast.success(pending.value ? 'User verified' : 'Verification removed')
        } else {
          if (pending.value) {
            await adminBanUser(userId)
            toast.success('User banned')
          } else {
            await adminUnbanUser(userId)
            toast.success('User unbanned')
          }
        }
        router.refresh()
      } catch (err) {
        toast.error((err as Error).message || 'Action failed')
      } finally {
        setPending(null)
      }
    })
  }

  const isDestructive =
    (pending?.kind === 'verify' && !pending.value) ||
    (pending?.kind === 'ban' && pending.value)

  const alertTitle =
    pending?.kind === 'verify'
      ? pending.value ? 'Verify this user?' : 'Remove verification?'
      : pending?.kind === 'ban'
      ? pending.value ? 'Ban this user?' : 'Unban this user?'
      : ''

  const alertDescription =
    pending?.kind === 'verify'
      ? pending.value
        ? 'The user will be marked as verified.'
        : 'Verification will be removed from this user.'
      : pending?.kind === 'ban'
      ? pending.value
        ? 'The user will be blocked from signing in. This can be reversed at any time.'
        : 'The user will be able to sign in again.'
      : ''

  const confirmLabel =
    pending?.kind === 'verify'
      ? pending.value ? 'Verify' : 'Remove verification'
      : pending?.kind === 'ban'
      ? pending.value ? 'Ban user' : 'Unban user'
      : 'Confirm'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${userId}`}>
              <Eye className="me-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setPending({ kind: 'verify', value: !isVerified })}>
            {isVerified ? (
              <>
                <ShieldOff className="me-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Remove verification</span>
              </>
            ) : (
              <>
                <ShieldCheck className="me-2 h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600">Verify user</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setPending({ kind: 'ban', value: !isBanned })}>
            {isBanned ? (
              <>
                <UserCheck className="me-2 h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600">Unban user</span>
              </>
            ) : (
              <>
                <Ban className="me-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Ban user</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className={
                isDestructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
