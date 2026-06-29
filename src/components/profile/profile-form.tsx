'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Loader2, Mail, Lock, Pencil } from 'lucide-react'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { Locale, getDictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { isValidILPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'

function VisibilityToggle({
  checked,
  onClick,
  label,
}: {
  checked: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
        checked ? 'justify-end bg-primary' : 'justify-start bg-input',
      )}
    >
      <span className="h-5 w-5 rounded-full bg-background shadow-sm transition-all" />
    </button>
  )
}

interface ProfileFormProps {
  locale: Locale
  /** True for email/password accounts (shows the reset control); false for Google
   *  accounts (shows an informational note — password is managed by Google). */
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

  // ── Avatar ──
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? undefined)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── Personal info ──
  const [editingInfo, setEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [info, setInfo] = useState({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    phone_number: user.phone_number ?? '',
    birth_date: user.birth_date ?? '',
    bio: user.bio ?? '',
  })

  // ── Password reset modal (email accounts only) ──
  const [pwOpen, setPwOpen] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // ── Visibility (what others can see) — auto-saves on toggle ──
  const [vis, setVis] = useState<ProfileVisibility>({
    bio: user.visibility?.bio ?? true,
    birthday: user.visibility?.birthday ?? false,
    reviews: user.visibility?.reviews ?? true,
  })

  const toggleVis = async (key: keyof ProfileVisibility) => {
    const next = { ...vis, [key]: !vis[key] }
    setVis(next)
    const res = await updateVisibility(next)
    if (!res.success) {
      setVis(vis) // revert on failure
      toast.error(t.visibilityUpdateFailed)
    }
  }

  const initials = (user.first_name?.[0] ?? user.email[0]).toUpperCase()
  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name ?? ''}`.trim()
    : user.email
  const memberSince = new Date(user.created_at).toLocaleDateString(
    locale === 'he' ? 'he-IL' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
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
      toast.error(t.invalidPhone)
      return
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
      if (!res.success) {
        throw new Error(res.message === 'INVALID_PHONE' ? t.invalidPhone : res.message || t.updateFailed)
      }
      toast.success(t.profileUpdated)
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
      {/* ── Identity ── */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label={t.changePhoto}
              className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-95 disabled:opacity-70"
            >
              {uploadingAvatar
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Camera className="h-4 w-4" aria-hidden="true" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-start">
            <p className="text-xl font-semibold">{displayName}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant={user.role === 'HOST' ? 'default' : 'secondary'}>{user.role}</Badge>
              {user.is_verified ? (
                <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                  {t.verified}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {t.notVerified}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t.memberSince}: {memberSince}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Personal info ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t.personalInfo}</CardTitle>
          {!editingInfo && (
            <Button variant="ghost" size="sm" onClick={() => setEditingInfo(true)}>
              <Pencil className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t.editProfile}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">{t.firstName}</Label>
            {editingInfo ? (
              <Input
                id="first_name"
                value={info.first_name}
                onChange={(e) => setInfo((p) => ({ ...p, first_name: e.target.value }))}
                placeholder={t.firstNamePlaceholder}
              />
            ) : (
              <p className="text-sm">{user.first_name ?? '—'}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">{t.lastName}</Label>
            {editingInfo ? (
              <Input
                id="last_name"
                value={info.last_name}
                onChange={(e) => setInfo((p) => ({ ...p, last_name: e.target.value }))}
                placeholder={t.lastNamePlaceholder}
              />
            ) : (
              <p className="text-sm">{user.last_name ?? '—'}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone_number">{t.phone}</Label>
            {editingInfo ? (
              <Input
                id="phone_number"
                type="tel"
                dir="ltr"
                value={info.phone_number}
                onChange={(e) => setInfo((p) => ({ ...p, phone_number: e.target.value }))}
                placeholder={t.phonePlaceholder}
              />
            ) : (
              <p className="text-sm">{user.phone_number ?? '—'}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_date">{t.birthday}</Label>
            {editingInfo ? (
              <Input
                id="birth_date"
                type="date"
                value={info.birth_date}
                onChange={(e) => setInfo((p) => ({ ...p, birth_date: e.target.value }))}
              />
            ) : (
              <p className="text-sm">{user.birth_date ?? '—'}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="bio">{t.bio}</Label>
            {editingInfo ? (
              <Textarea
                id="bio"
                rows={3}
                value={info.bio}
                onChange={(e) => setInfo((p) => ({ ...p, bio: e.target.value }))}
                placeholder={t.bioPlaceholder}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm">{user.bio ?? '—'}</p>
            )}
          </div>

          {editingInfo && (
            <div className="flex gap-3 sm:col-span-2">
              <Button onClick={handleInfoSave} disabled={savingInfo} className="flex-1">
                {savingInfo ? t.saving : t.save}
              </Button>
              <Button variant="outline" onClick={handleInfoCancel} disabled={savingInfo} className="flex-1">
                {t.cancel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Account & security ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.accountSecurity}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Email (read-only — changing it is not supported) */}
          <div className="flex min-w-0 items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.email}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Password — email accounts can reset; Google accounts are managed by Google */}
          {isEmailAccount ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">{t.changePassword}</p>
                  <p className="text-xs text-muted-foreground">{t.passwordHintHasPw}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => { setResetSent(false); setPwOpen(true) }}
              >
                {t.changePassword}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <GoogleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{t.googleAccountTitle}</p>
                <p className="text-xs text-muted-foreground">{t.googleAccountBody}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── What others can see ── */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">{t.visibilityTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.visibilityHint}</p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {([
            ['bio', t.bio],
            ['birthday', t.birthday],
            ['reviews', t.visibilityReviews],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm">{label}</span>
              <VisibilityToggle checked={vis[key]} onClick={() => toggleVis(key)} label={label} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Password reset modal (email accounts) ── */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.resetPasswordTitle}</DialogTitle>
            <DialogDescription>
              {resetSent ? t.resetPasswordSent : t.resetPasswordBody}
            </DialogDescription>
          </DialogHeader>
          {!resetSent && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPwOpen(false)} disabled={sendingReset}>
                {t.cancel}
              </Button>
              <Button onClick={handleSendReset} disabled={sendingReset}>
                {sendingReset ? t.resetPasswordSending : t.resetPasswordSend}
              </Button>
            </DialogFooter>
          )}
          {resetSent && (
            <DialogFooter>
              <Button onClick={() => setPwOpen(false)}>{t.cancel}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
