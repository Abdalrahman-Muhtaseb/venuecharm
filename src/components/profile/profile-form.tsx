'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Camera, Loader2, Mail, Lock, Pencil, User,
  Phone, FileText, Shield, CheckCircle2, XCircle, ArrowLeft, Cake,
} from 'lucide-react'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Locale, getDictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  updateProfile,
  updateAvatar,
  sendPasswordReset,
  updateVisibility,
  type ProfileVisibility,
} from '@/actions/profile'
import { isValidILPhone, normalizeILPhone } from '@/lib/phone'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Israeli phone input ───────────────────────────────────────────
// Strips the country code so user only sees/types the local part (e.g. 054-123-4567).
function toLocalPhone(stored: string): string {
  const s = stored.trim()
  if (s.startsWith('+972')) return '0' + s.slice(4)
  if (s.startsWith('972')) return '0' + s.slice(3)
  return s
}

function formatLocalPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length >= 3) {
    const area = digits.slice(0, 3)
    const rest = digits.slice(3)
    if (rest.length > 4) return `${area}-${rest.slice(0, 3)}-${rest.slice(3, 7)}`
    if (rest.length > 0) return `${area}-${rest.slice(0, 3)}`
    return area
  }
  return raw
}

interface ILPhoneInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

function ILPhoneInput({ value, onChange, placeholder }: ILPhoneInputProps) {
  const local = toLocalPhone(value)
  return (
    <div className="flex">
      <span className="flex items-center gap-1.5 rounded-s-md border border-e-0 bg-muted px-3 text-sm text-muted-foreground">
        🇮🇱 +972
      </span>
      <Input
        type="tel"
        dir="ltr"
        className="rounded-s-none"
        placeholder={placeholder ?? '05X-XXX-XXXX'}
        defaultValue={local}
        onChange={(e) => {
          const raw = e.target.value
          // Store the value as typed — normalised/validated on save
          onChange(raw)
        }}
        onBlur={(e) => {
          const formatted = formatLocalPhone(e.target.value)
          e.target.value = formatted
          onChange(formatted)
        }}
      />
    </div>
  )
}

// ── Birthday picker (day / month / year selects) ──────────────────
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface BirthdayPickerProps {
  value: string          // stored as YYYY-MM-DD (or empty)
  onChange: (iso: string) => void
}

function BirthdayPicker({ value, onChange }: BirthdayPickerProps) {
  const [y, m, d] = value ? value.split('-').map(Number) : [undefined, undefined, undefined]
  const [year,  setYear]  = useState<number | undefined>(y)
  const [month, setMonth] = useState<number | undefined>(m) // 1-based
  const [day,   setDay]   = useState<number | undefined>(d)

  const currentYear = new Date().getFullYear()
  const maxBirthYear = currentYear - 18  // users must be 18+
  const years = Array.from({ length: maxBirthYear - 1919 }, (_, i) => maxBirthYear - i)
  const daysInMonth = month && year ? new Date(year, month, 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const emit = (yr: number | undefined, mo: number | undefined, dy: number | undefined) => {
    if (yr && mo && dy) {
      const iso = `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`
      onChange(iso)
    } else {
      onChange('')
    }
  }

  return (
    <div className="flex gap-2">
      {/* Day */}
      <Select
        value={day ? String(day) : ''}
        onValueChange={(v) => { const n = Number(v); setDay(n); emit(year, month, n) }}
      >
        <SelectTrigger className="w-20 shrink-0">
          <SelectValue placeholder="DD" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>{String(d).padStart(2, '0')}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select
        value={month ? String(month) : ''}
        onValueChange={(v) => { const n = Number(v); setMonth(n); emit(year, n, day) }}
      >
        <SelectTrigger className="min-w-0 flex-1">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, idx) => (
            <SelectItem key={idx + 1} value={String(idx + 1)}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year */}
      <Select
        value={year ? String(year) : ''}
        onValueChange={(v) => { const n = Number(v); setYear(n); emit(n, month, day) }}
      >
        <SelectTrigger className="w-24 shrink-0">
          <SelectValue placeholder="YYYY" />
        </SelectTrigger>
        <SelectContent>
          {years.map((yr) => (
            <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ProfileFormProps {
  locale: Locale
  isEmailAccount: boolean
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone_number: string | null
    bio: string | null
    birth_date: string | null
    visibility: ProfileVisibility | null
    avatar_url: string | null
    role: string
    is_verified: boolean
    created_at: string
  }
}

export default function ProfileForm({ locale, isEmailAccount, user }: ProfileFormProps) {
  const t = getDictionary(locale).profile
  const router = useRouter()
  const isHe = locale === 'he'

  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? undefined)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [editingInfo, setEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [info, setInfo] = useState({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    phone_number: user.phone_number ?? '',
    birth_date: user.birth_date ?? '', // stored as YYYY-MM-DD
    bio: user.bio ?? '',
  })

  const [pwOpen, setPwOpen] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const initials = (user.first_name?.[0] ?? user.email[0]).toUpperCase()
  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : user.email
  const memberSince = new Date(user.created_at).toLocaleDateString(
    isHe ? 'he-IL' : 'en-US',
    { year: 'numeric', month: 'long' },
  )

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await updateAvatar(fd)
      if (!res.success) throw new Error(res.message || t.avatarUploadFailed)
      if (res.message) setAvatarUrl(res.message)
      toast.success(t.avatarUpdated)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.avatarUploadFailed)
    } finally {
      setUploadingAvatar(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleInfoSave = async () => {
    if (info.phone_number.trim() && !isValidILPhone(info.phone_number)) {
      toast.error(t.invalidPhone); return
    }
    setSavingInfo(true)
    try {
      const fd = new FormData()
      fd.append('first_name', info.first_name)
      fd.append('last_name', info.last_name)
      fd.append('phone_number', info.phone_number)
      fd.append('birth_date', info.birth_date)
      fd.append('bio', info.bio)
      const res = await updateProfile(fd)
      if (!res.success) throw new Error(res.message === 'INVALID_PHONE' ? t.invalidPhone : res.message || t.updateFailed)
      toast.success(t.profileUpdated)
      // Birthday is always private — silently enforce it on every save.
      await updateVisibility({ bio: true, birthday: false, reviews: true })
      setEditingInfo(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.updateFailed)
    } finally {
      setSavingInfo(false)
    }
  }

  const handleInfoCancel = () => {
    setInfo({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
      birth_date: user.birth_date ?? '',
      bio: user.bio ?? '',
    })
    setEditingInfo(false)
  }

  // ── Date helpers: stored YYYY-MM-DD ↔ display "Jan 5, 2000" ──
  function formatBirthDate(iso: string): string {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return '—'
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Parses dd/mm/yyyy → yyyy-mm-dd; returns empty string on invalid input.
  function parseDDMMYYYY(raw: string): string {
    const parts = raw.replace(/[^\d]/g, '').match(/^(\d{1,2})(\d{1,2})(\d{4})$/)
    if (!parts) return raw // partial entry — keep as-is
    const [, d, m, y] = parts
    const dd = d.padStart(2, '0')
    const mm = m.padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  // Display-friendly dd/mm/yyyy from stored yyyy-mm-dd
  function toDisplayDate(iso: string): string {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d ?? ''}/${m ?? ''}/${y ?? ''}`
  }

  const handleSendReset = async () => {
    setSendingReset(true)
    try {
      const res = await sendPasswordReset()
      if (!res.success) throw new Error(res.message || t.passwordUpdateFailed)
      setResetSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.passwordUpdateFailed)
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Back button ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {isHe ? 'חזרה' : 'Back'}
      </button>

      {/* ── Hero banner ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/85 to-violet-700 p-6 sm:p-8">
        {/* Dot mesh overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Edit button */}
        {!editingInfo && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingInfo(true)}
            className="absolute end-4 top-4 z-10 gap-1.5 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t.editProfile}
          </Button>
        )}

        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:gap-6 sm:text-start">
          {/* Avatar with camera overlay */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 ring-4 ring-white/40 shadow-xl sm:h-28 sm:w-28">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-bold backdrop-blur-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label={t.changePhoto}
              className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/30 active:scale-95 disabled:opacity-70"
            >
              {uploadingAvatar
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onAvatarChange} />
          </div>

          {/* Identity */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{displayName}</h2>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge className="bg-white/20 text-white hover:bg-white/25 border-white/30 backdrop-blur-sm">
                {user.role}
              </Badge>
              {user.is_verified ? (
                <Badge className="gap-1 bg-emerald-500/80 text-white border-0 backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.verified}
                </Badge>
              ) : (
                <Badge className="gap-1 bg-amber-500/70 text-white border-0 backdrop-blur-sm">
                  <XCircle className="h-3 w-3" />
                  {t.notVerified}
                </Badge>
              )}
            </div>
            <p className="text-sm text-white/70">{t.memberSince} {memberSince}</p>
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: personal info + bio */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">{t.personalInfo}</CardTitle>
              </div>
              {!editingInfo && (
                <Button variant="ghost" size="sm" onClick={() => setEditingInfo(true)} className="text-primary hover:text-primary">
                  <Pencil className="me-1.5 h-3.5 w-3.5" />
                  {t.editProfile}
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* First name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="first_name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.firstName}
                  </Label>
                  {editingInfo ? (
                    <Input id="first_name" value={info.first_name} onChange={(e) => setInfo((p) => ({ ...p, first_name: e.target.value }))} placeholder={t.firstNamePlaceholder} />
                  ) : (
                    <p className="text-sm font-medium">{user.first_name ?? <span className="text-muted-foreground">—</span>}</p>
                  )}
                </div>

                {/* Last name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="last_name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.lastName}
                  </Label>
                  {editingInfo ? (
                    <Input id="last_name" value={info.last_name} onChange={(e) => setInfo((p) => ({ ...p, last_name: e.target.value }))} placeholder={t.lastNamePlaceholder} />
                  ) : (
                    <p className="text-sm font-medium">{user.last_name ?? <span className="text-muted-foreground">—</span>}</p>
                  )}
                </div>

                {/* Phone — structured input with +972 prefix */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {t.phone}
                  </Label>
                  {editingInfo ? (
                    <ILPhoneInput
                      value={info.phone_number}
                      onChange={(v) => setInfo((p) => ({ ...p, phone_number: v }))}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {user.phone_number ? formatLocalPhone(toLocalPhone(user.phone_number)) : <span className="text-muted-foreground">—</span>}
                    </p>
                  )}
                </div>

                {/* Birthday — day/month/year selects, always private */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Cake className="h-3 w-3" />
                    {t.birthday}
                  </Label>
                  {editingInfo ? (
                    <BirthdayPicker
                      value={info.birth_date}
                      onChange={(iso) => setInfo((p) => ({ ...p, birth_date: iso }))}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formatBirthDate(user.birth_date ?? '')}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="bio" className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {t.bio}
                  </Label>
                  {editingInfo ? (
                    <Textarea id="bio" rows={4} value={info.bio} onChange={(e) => setInfo((p) => ({ ...p, bio: e.target.value }))} placeholder={t.bioPlaceholder} />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{user.bio ?? <span className="text-muted-foreground">—</span>}</p>
                  )}
                </div>

                {/* Save / Cancel row */}
                {editingInfo && (
                  <div className="flex gap-3 sm:col-span-2">
                    <Button onClick={handleInfoSave} disabled={savingInfo} className="flex-1">
                      {savingInfo ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t.saving}</> : t.save}
                    </Button>
                    <Button variant="outline" onClick={handleInfoCancel} disabled={savingInfo} className="flex-1">
                      {t.cancel}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: account & security */}
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm font-semibold">{t.accountSecurity}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Email */}
              <div className="flex items-center gap-3 py-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t.email}</p>
                  <p className="truncate text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <Separator className="my-2" />

              {/* Password / Google */}
              {isEmailAccount ? (
                <div className="flex items-center justify-between gap-3 py-2">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm">{t.changePassword}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setResetSent(false); setPwOpen(true) }}>
                    {isHe ? 'שנה' : 'Reset'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <GoogleIcon className="h-4 w-4 shrink-0" />
                  <p className="text-sm text-muted-foreground">{t.googleAccountTitle}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Password reset modal ──────────────────────────────────── */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.resetPasswordTitle}</DialogTitle>
            <DialogDescription>
              {resetSent ? t.resetPasswordSent : t.resetPasswordBody}
            </DialogDescription>
          </DialogHeader>
          {!resetSent ? (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPwOpen(false)} disabled={sendingReset}>{t.cancel}</Button>
              <Button onClick={handleSendReset} disabled={sendingReset}>
                {sendingReset ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t.resetPasswordSending}</> : t.resetPasswordSend}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button onClick={() => setPwOpen(false)}>{t.cancel}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
