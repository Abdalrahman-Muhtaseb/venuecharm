'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, AlertCircle, CheckCircle2, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { importAmenities, type AmenityInput } from '@/actions/amenities'
import { amenityIcon, AMENITY_CATEGORIES, AMENITY_ICON_NAMES } from '@/lib/amenities'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── CSV helpers ───────────────────────────────────────────────────────────────

const CSV_HEADERS = ['key', 'label_en', 'label_he', 'category', 'icon', 'sort_order', 'is_active'] as const
const TEMPLATE_ROWS = [
  ['WiFi', 'WiFi', 'WiFi', 'Core', 'Wifi', '10', 'true'],
  ['Parking', 'Parking', 'חניה', 'Core', 'Car', '20', 'true'],
  ['Projector', 'Projector', 'מקרן', 'AV & Events', 'Projector', '50', 'true'],
]

function downloadTemplate() {
  const lines = [
    CSV_HEADERS.join(','),
    ...TEMPLATE_ROWS.map((r) => r.map((v) => (v.includes(',') ? `"${v}"` : v)).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'amenities-template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const cells: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cells.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur)
    rows.push(cells)
  }
  return rows
}

function parseBool(v: string): boolean {
  return v.trim().toLowerCase() === 'true' || v.trim() === '1'
}

interface ParsedRow {
  raw: AmenityInput
  errors: string[]
}

function parseRows(cells: string[][], headerMap: Map<string, number>): ParsedRow[] {
  return cells.map((row) => {
    const get = (col: string) => (row[headerMap.get(col) ?? -1] ?? '').trim()
    const raw: AmenityInput = {
      key:        get('key'),
      label_en:   get('label_en'),
      label_he:   get('label_he'),
      category:   get('category') || 'Other',
      icon:       get('icon') || 'CheckCircle2',
      sort_order: parseInt(get('sort_order') || '0', 10) || 0,
      is_active:  get('is_active') !== '' ? parseBool(get('is_active')) : true,
    }
    const errors: string[] = []
    if (!raw.key)      errors.push('key required')
    if (!raw.label_en) errors.push('label_en required')
    if (!raw.label_he) errors.push('label_he required')
    if (raw.icon && !AMENITY_ICON_NAMES.includes(raw.icon)) raw.icon = 'CheckCircle2'
    if (raw.category && !AMENITY_CATEGORIES.includes(raw.category as any)) raw.category = 'Other'
    return { raw, errors }
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

type Step = 'idle' | 'preview'

export function AmenitiesImportDialog({ open, onOpenChange }: Props) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)

  const [pending, startTransition] = useTransition()
  const [step, setStep]            = useState<Step>('idle')
  const [fileName, setFileName]    = useState('')
  const [rows, setRows]            = useState<ParsedRow[]>([])
  const [dragging, setDragging]    = useState(false)

  const validRows   = rows.filter((r) => r.errors.length === 0)
  const invalidRows = rows.filter((r) => r.errors.length > 0)

  function reset() {
    setStep('idle')
    setFileName('')
    setRows([])
    if (inputRef.current) inputRef.current.value = ''
  }

  function processFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.name.endsWith('.txt')) {
      toast.error('Please upload a .csv file')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      const parsed = parseCSV(text)
      if (parsed.length < 2) {
        toast.error('File appears empty or has no data rows')
        return
      }
      const header = parsed[0].map((h) => h.trim().toLowerCase())
      const headerMap = new Map(header.map((h, i) => [h, i]))
      const missing = ['key', 'label_en', 'label_he'].filter((h) => !headerMap.has(h))
      if (missing.length) {
        toast.error(`Missing required columns: ${missing.join(', ')}`)
        return
      }
      const dataRows = parsed.slice(1).filter((r) => r.some((c) => c.trim()))
      setRows(parseRows(dataRows, headerMap))
      setStep('preview')
    }
    reader.readAsText(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function submit() {
    if (!validRows.length) return
    startTransition(async () => {
      try {
        const result = await importAmenities(validRows.map((r) => r.raw))
        toast.success(
          `Imported ${result.total} amenity${result.total !== 1 ? 's' : ''}${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`,
        )
        router.refresh()
        onOpenChange(false)
        reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Import failed')
      }
    })
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import amenities from CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="space-y-4 py-2">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">CSV format</p>
                <p className="text-xs text-muted-foreground">
                  Columns: <span className="font-mono">key, label_en, label_he, category, icon, sort_order, is_active</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Existing keys are <strong>updated</strong>; new keys are inserted.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="me-1.5 h-3.5 w-3.5" />
                Template
              </Button>
            </div>

            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drop your CSV here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-3 py-2">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
              </div>
              <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {validRows.length} valid
              </Badge>
              {invalidRows.length > 0 && (
                <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/5 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {invalidRows.length} invalid (will be skipped)
                </Badge>
              )}
              <button
                type="button"
                onClick={reset}
                className="ms-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Change file
              </button>
            </div>

            {/* Preview table */}
            <div className="max-h-64 overflow-y-auto rounded-xl border text-xs">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium text-muted-foreground w-7"></th>
                    <th className="px-3 py-2 text-start font-medium text-muted-foreground">Key</th>
                    <th className="px-3 py-2 text-start font-medium text-muted-foreground">English</th>
                    <th className="px-3 py-2 text-start font-medium text-muted-foreground">Hebrew</th>
                    <th className="px-3 py-2 text-start font-medium text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const Icon = amenityIcon(r.raw.icon)
                    const hasErr = r.errors.length > 0
                    return (
                      <tr
                        key={i}
                        className={cn(
                          'border-t',
                          hasErr ? 'bg-destructive/5' : 'hover:bg-muted/30',
                        )}
                      >
                        <td className="px-3 py-1.5 text-center">
                          {hasErr
                            ? <span title={r.errors.join(', ')}><AlertCircle className="h-3.5 w-3.5 text-destructive mx-auto" /></span>
                            : <Icon className="h-3.5 w-3.5 text-primary mx-auto" />}
                        </td>
                        <td className={cn('px-3 py-1.5 font-mono', hasErr ? 'text-destructive' : '')}>
                          {r.raw.key || <span className="italic text-destructive">missing</span>}
                        </td>
                        <td className="px-3 py-1.5">{r.raw.label_en || <span className="italic text-destructive">missing</span>}</td>
                        <td className="px-3 py-1.5" dir="rtl">{r.raw.label_he || <span className="italic text-destructive">missing</span>}</td>
                        <td className="px-3 py-1.5">
                          <span className="rounded-full border px-2 py-0.5 text-[10px]">{r.raw.category}</span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                            r.raw.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground',
                          )}>
                            {r.raw.is_active ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Rows with errors will be skipped. Fix the CSV and re-upload to include them.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          {step === 'preview' && (
            <Button onClick={submit} disabled={pending || validRows.length === 0}>
              {pending ? 'Importing…' : `Import ${validRows.length} amenity${validRows.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
