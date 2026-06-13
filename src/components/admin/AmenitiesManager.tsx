'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AMENITY_CATEGORIES, AMENITY_ICON_NAMES, amenityIcon, type Amenity,
} from '@/lib/amenities'
import {
  createAmenity, updateAmenity, deleteAmenity, setAmenityActive, type AmenityInput,
} from '@/actions/amenities'
import { cn } from '@/lib/utils'

type AmenityRow = Amenity & { id: string }

const EMPTY: AmenityInput = {
  key: '', label_en: '', label_he: '', category: 'Core', icon: 'CheckCircle2', sort_order: 0, is_active: true,
}

export function AmenitiesManager({ initialAmenities }: { initialAmenities: AmenityRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AmenityInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY, sort_order: (initialAmenities.at(-1)?.sort_order ?? 0) + 10 })
    setError(null)
    setDialogOpen(true)
  }

  const openEdit = (a: AmenityRow) => {
    setEditingId(a.id)
    setForm({
      key: a.key, label_en: a.label_en, label_he: a.label_he,
      category: a.category, icon: a.icon,
      sort_order: a.sort_order ?? 0, is_active: a.is_active ?? true,
    })
    setError(null)
    setDialogOpen(true)
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      try {
        if (editingId) await updateAmenity(editingId, form)
        else await createAmenity(form)
        setDialogOpen(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  const toggleActive = (a: AmenityRow) => {
    startTransition(async () => {
      try {
        await setAmenityActive(a.id, !(a.is_active ?? true))
        router.refresh()
      } catch { /* ignore */ }
    })
  }

  const remove = (a: AmenityRow) => {
    if (!confirm(`Delete amenity "${a.label_en}"? This won't remove it from existing listings.`)) return
    startTransition(async () => {
      try {
        await deleteAmenity(a.id)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Failed to delete.')
      }
    })
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="me-1.5 h-4 w-4" /> Add amenity
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Key</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Hebrew</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-16 text-center">Order</TableHead>
              <TableHead className="w-20 text-center">Active</TableHead>
              <TableHead className="w-28 text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialAmenities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No amenities yet. Click &ldquo;Add amenity&rdquo; to create one.
                </TableCell>
              </TableRow>
            ) : (
              initialAmenities.map((a) => {
                const Icon = amenityIcon(a.icon)
                return (
                  <TableRow key={a.id} className={cn(!(a.is_active ?? true) && 'opacity-50')}>
                    <TableCell><Icon className="h-4 w-4 text-primary" /></TableCell>
                    <TableCell className="font-mono text-xs">{a.key}</TableCell>
                    <TableCell>{a.label_en}</TableCell>
                    <TableCell dir="rtl">{a.label_he}</TableCell>
                    <TableCell><Badge variant="outline" className="font-normal">{a.category}</Badge></TableCell>
                    <TableCell className="text-center tabular-nums">{a.sort_order}</TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleActive(a)}
                        disabled={pending}
                        aria-label={a.is_active ? 'Deactivate' : 'Activate'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
                      >
                        {(a.is_active ?? true)
                          ? <Eye className="h-4 w-4 text-emerald-600" />
                          : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)} aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(a)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit amenity' : 'New amenity'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="am-key">Key <span className="text-muted-foreground">(stored on venues)</span></Label>
              <Input id="am-key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="WiFi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="am-en">English label</Label>
                <Input id="am-en" value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} placeholder="WiFi" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="am-he">Hebrew label</Label>
                <Input id="am-he" dir="rtl" value={form.label_he} onChange={(e) => setForm({ ...form, label_he: e.target.value })} placeholder="WiFi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AMENITY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {AMENITY_ICON_NAMES.map((name) => {
                      const Icon = amenityIcon(name)
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{name}</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="grid gap-1.5">
                <Label htmlFor="am-order">Sort order</Label>
                <Input
                  id="am-order"
                  type="number"
                  className="w-28"
                  value={String(form.sort_order)}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-5">
                <Checkbox checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: !!c })} />
                <span className="text-sm">Active</span>
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
