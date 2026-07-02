'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const STATUS_OPTIONS = [
  { value: 'ACTIVE',           label: 'Active' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'DRAFT',            label: 'Draft' },
  { value: 'SUSPENDED',        label: 'Suspended' },
] as const

export function AdminVenuesFilterButton() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const activeStatuses = (searchParams.get('status') ?? '').split(',').filter(Boolean)
  const [staged, setStaged] = useState<string[]>([])

  function toggle(value: string) {
    setStaged((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    )
  }

  function openDialog() {
    setStaged(activeStatuses)
    setOpen(true)
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    if (staged.length === 0) {
      params.delete('status')
    } else {
      params.set('status', staged.join(','))
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function clearAll() {
    setStaged([])
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <SlidersHorizontal className="me-2 h-4 w-4" />
        Filters
        {activeStatuses.length > 0 && (
          <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">
            {activeStatuses.length}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Filter venues</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Status</p>
            <div className="space-y-3">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-3">
                  <Checkbox
                    id={`filter-${value}`}
                    checked={staged.includes(value)}
                    onCheckedChange={() => toggle(value)}
                  />
                  <Label htmlFor={`filter-${value}`} className="cursor-pointer font-normal">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              Clear all
            </Button>
            <Button size="sm" onClick={apply}>
              Show results
              {staged.length > 0 && (
                <Badge variant="secondary" className="ms-2 h-5 rounded-full px-1.5 text-xs">
                  {staged.length}
                </Badge>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
