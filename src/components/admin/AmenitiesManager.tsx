'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, Search,
  ChevronDown, ChevronRight, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AMENITY_CATEGORIES, AMENITY_ICON_NAMES, amenityIcon, type Amenity,
} from '@/lib/amenities'
import {
  createAmenity, updateAmenity, deleteAmenity, setAmenityActive, type AmenityInput,
} from '@/actions/amenities'
import { AmenitiesImportDialog } from '@/components/admin/AmenitiesImportDialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type AmenityRow = Amenity & { id: string }

const EMPTY: AmenityInput = {
  key: '', label_en: '', label_he: '', category: 'Core',
  icon: 'CheckCircle2', sort_order: 0, is_active: true,
}

const CATEGORY_COLORS: Record<string, string> = {
  'Core':            'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
  'AV & Events':     'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800',
  'Food & Drink':    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  'Outdoor & Spaces':'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  'Facilities':      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
  'Other':           'bg-muted text-muted-foreground border-border',
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
      CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    )}>
      {category}
    </span>
  )
}

export function AmenitiesManager({ initialAmenities }: { initialAmenities: AmenityRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('')
  const [formOpen, setFormOpen]       = useState(false)
  const [importOpen, setImportOpen]   = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [form, setForm]               = useState<AmenityInput>(EMPTY)
  const [formError, setFormError]     = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AmenityRow | null>(null)
  const [collapsed, setCollapsed]     = useState<Set<string>>(new Set())

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return initialAmenities
    return initialAmenities.filter(
      (a) =>
        a.key.toLowerCase().includes(q) ||
        a.label_en.toLowerCase().includes(q) ||
        a.label_he.includes(q) ||
        a.category.toLowerCase().includes(q),
    )
  }, [initialAmenities, search])

  const grouped = useMemo(() => {
    const map = new Map<string, AmenityRow[]>()
    for (const a of filtered) {
      const cat = a.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(a)
    }
    // Sort categories in the canonical order, then any extra
    const order = [...AMENITY_CATEGORIES, 'Other']
    return [...map.entries()].sort(([a], [b]) => {
      const ai = order.indexOf(a); const bi = order.indexOf(b)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  }, [filtered])

  const activeCount  = initialAmenities.filter((a) => a.is_active ?? true).length
  const categoryCount = new Set(initialAmenities.map((a) => a.category)).size

  // ── Form handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY, sort_order: (initialAmenities.at(-1)?.sort_order ?? 0) + 10 })
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (a: AmenityRow) => {
    setEditingId(a.id)
    setForm({
      key: a.key, label_en: a.label_en, label_he: a.label_he,
      category: a.category, icon: a.icon,
      sort_order: a.sort_order ?? 0, is_active: a.is_active ?? true,
    })
    setFormError(null)
    setFormOpen(true)
  }

  const submit = () => {
    setFormError(null)
    startTransition(async () => {
      try {
        if (editingId) await updateAmenity(editingId, form)
        else await createAmenity(form)
        setFormOpen(false)
        router.refresh()
        toast.success(editingId ? 'Amenity updated' : 'Amenity created')
      } catch (e) {
        setFormError(e instanceof Error ? e.message : 'Something went wrong.')
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

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteAmenity(deleteTarget.id)
        router.refresh()
        toast.success(`"${deleteTarget.label_en}" deleted`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to delete.')
      } finally {
        setDeleteTarget(null)
      }
    })
  }

  const toggleCollapse = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  return (
    <div className="space-y-4">

      {/* ── Stat row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Layers className="h-4 w-4" />
          <strong className="text-foreground">{initialAmenities.length}</strong> total
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          <strong className="text-emerald-600">{activeCount}</strong> active
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          <strong className="text-foreground">{categoryCount}</strong> categories
        </span>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amenities…"
            className="ps-9"
          />
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="me-1.5 h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="me-1.5 h-4 w-4" />
            Add amenity
          </Button>
        </div>
      </div>

      {/* ── Grouped table ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          {search ? `No amenities matching "${search}"` : 'No amenities yet. Click "Add amenity" to create one.'}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([category, rows]) => {
            const isCollapsed = collapsed.has(category)
            return (
              <div key={category} className="overflow-hidden rounded-xl border bg-background">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(category)}
                  className="flex w-full items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-start hover:bg-muted/50 transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <CategoryBadge category={category} />
                  <span className="text-xs text-muted-foreground">{rows.length} item{rows.length !== 1 ? 's' : ''}</span>
                </button>

                {/* Rows */}
                {!isCollapsed && (
                  <div className="divide-y">
                    {rows.map((a) => {
                      const Icon = amenityIcon(a.icon)
                      const isActive = a.is_active ?? true
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20',
                            !isActive && 'opacity-50',
                          )}
                        >
                          {/* Icon */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>

                          {/* Labels */}
                          <div className="min-w-0 flex-1 grid grid-cols-3 items-center gap-x-4">
                            <div>
                              <p className="text-sm font-medium truncate">{a.label_en}</p>
                              <p className="font-mono text-[11px] text-muted-foreground">{a.key}</p>
                            </div>
                            <p className="text-sm truncate" dir="rtl">{a.label_he}</p>
                            <p className="text-xs text-muted-foreground tabular-nums text-end">order {a.sort_order ?? 0}</p>
                          </div>

                          {/* Active toggle */}
                          <button
                            type="button"
                            onClick={() => toggleActive(a)}
                            disabled={pending}
                            aria-label={isActive ? 'Deactivate' : 'Activate'}
                            title={isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted',
                            )}
                          >
                            {isActive
                              ? <Eye    className="h-4 w-4 text-emerald-600" />
                              : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                          </button>

                          {/* Edit / delete */}
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => openEdit(a)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(a)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit dialog ──────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit amenity' : 'New amenity'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="am-key">
                Key <span className="text-muted-foreground text-xs">(stored on venues, unique)</span>
              </Label>
              <Input
                id="am-key"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="WiFi"
                disabled={!!editingId}
              />
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
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.label_en}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the amenity from the catalog. Existing venue listings that already have this
              amenity checked are not affected — only the option to select it going forward is removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Import dialog ─────────────────────────────────────────────────── */}
      <AmenitiesImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
