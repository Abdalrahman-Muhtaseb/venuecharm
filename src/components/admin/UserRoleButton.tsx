'use client'

import { useState, useTransition } from 'react'
import { adminChangeUserRole, adminToggleVerified } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface UserRoleButtonProps {
  userId: string
  currentRole: string
  isVerified: boolean
}

const ROLES = ['RENTER', 'HOST', 'ADMIN']

export function UserRoleButton({ userId, currentRole, isVerified }: UserRoleButtonProps) {
  const [role, setRole] = useState(currentRole)
  const [verified, setVerified] = useState(isVerified)
  const [pendingRole, startRole] = useTransition()
  const [pendingVerify, startVerify] = useTransition()

  function handleRoleChange(newRole: string) {
    setRole(newRole)
    startRole(async () => {
      try {
        await adminChangeUserRole(userId, newRole)
        toast.success(`Role changed to ${newRole}`)
      } catch {
        setRole(role)
        toast.error('Failed to change role')
      }
    })
  }

  function handleVerifyToggle() {
    const next = !verified
    setVerified(next)
    startVerify(async () => {
      try {
        await adminToggleVerified(userId, next)
        toast.success(next ? 'User verified' : 'Verification removed')
      } catch {
        setVerified(!next)
        toast.error('Failed to update verification')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={handleRoleChange} disabled={pendingRole}>
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={verified ? 'outline' : 'secondary'}
        size="sm"
        className="h-8 text-xs"
        onClick={handleVerifyToggle}
        disabled={pendingVerify}
      >
        {verified ? 'Verified ✓' : 'Unverified'}
      </Button>
    </div>
  )
}
