'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Loader2, Mail, Lock, Pencil } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateProfile, updateEmail, updatePassword, updateAvatar } from '@/actions/profile'

interface ProfileFormProps {
  locale: Locale
  user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone_number: string | null
    avatar_url: string | null
    role: string
    is_verified: boolean
    created_at: string
  }
}

export default function ProfileForm({ locale, user }: ProfileFormProps) {
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
  })

  // ── Email ──
  const [editingEmail, setEditingEmail] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  // ── Password ──
  const [editingPw, setEditingPw] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')

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
    setSavingInfo(true)
    try {
      const fd = new FormData()
      fd.append('first_name', info.first_name)
      fd.append('last_name', info.last_name)
      fd.append('phone_number', info.phone_number)
      const res = await updateProfile(fd)
      if (!res.success) throw new Error(res.message || t.updateFailed)
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
    })
    setEditingInfo(false)
  }

  const handleEmailSave = async () => {
    setSavingEmail(true)
    try {
      const fd = new FormData()
      fd.append('email', newEmail)
      const res = await updateEmail(fd)
      if (!res.success) throw new Error(res.message || t.emailUpdateFailed)
      toast.success(t.emailChangeRequested)
      setEditingEmail(false)
      setNewEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.emailUpdateFailed)
    } finally {
      setSavingEmail(false)
    }
  }

  const handlePwSave = async () => {
    if (pw.length < 6) { toast.error(t.passwordTooShort); return }
    if (pw !== pwConfirm) { toast.error(t.passwordsDoNotMatch); return }
    setSavingPw(true)
    try {
      const fd = new FormData()
      fd.append('password', pw)
      fd.append('confirm', pwConfirm)
      const res = await updatePassword(fd)
      if (!res.success) throw new Error(res.message || t.passwordUpdateFailed)
      toast.success(t.passwordUpdated)
      setEditingPw(false)
      setPw('')
      setPwConfirm('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.passwordUpdateFailed)
    } finally {
      setSavingPw(false)
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

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="phone_number">{t.phone}</Label>
            {editingInfo ? (
              <Input
                id="phone_number"
                type="tel"
                value={info.phone_number}
                onChange={(e) => setInfo((p) => ({ ...p, phone_number: e.target.value }))}
                placeholder={t.phonePlaceholder}
              />
            ) : (
              <p className="text-sm">{user.phone_number ?? '—'}</p>
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
          {/* Email */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.email}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {!editingEmail && (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditingEmail(true)}>
                  {t.changeEmail}
                </Button>
              )}
            </div>
            {editingEmail && (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new_email">{t.newEmail}</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleEmailSave} disabled={savingEmail} size="sm" className="flex-1">
                    {savingEmail ? t.saving : t.update}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={savingEmail}
                    onClick={() => { setEditingEmail(false); setNewEmail('') }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">{t.changePassword}</p>
              </div>
              {!editingPw && (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditingPw(true)}>
                  {t.changePassword}
                </Button>
              )}
            </div>
            {editingPw && (
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new_password">{t.newPassword}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm_password">{t.confirmPassword}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handlePwSave} disabled={savingPw} size="sm" className="flex-1">
                    {savingPw ? t.saving : t.update}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={savingPw}
                    onClick={() => { setEditingPw(false); setPw(''); setPwConfirm('') }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
