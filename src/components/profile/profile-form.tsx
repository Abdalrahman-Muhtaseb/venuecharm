'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Locale, getDictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  const t = getDictionary(locale)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user.first_name ?? '',
    last_name: user.last_name ?? '',
    phone_number: user.phone_number ?? '',
  })

  const initials =
    (user.first_name?.[0] ?? user.email[0]).toUpperCase()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || t.profile.updateFailed)
      }
      toast.success(t.profile.profileUpdated)
      setIsEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.updateFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone_number: user.phone_number ?? '',
    })
    setIsEditing(false)
  }

  const memberSince = new Date(user.created_at).toLocaleDateString(
    locale === 'he' ? 'he-IL' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  )

  return (
    <div className="space-y-8">
      {/* Avatar row */}
      <div className="flex items-center gap-5">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">
            {user.first_name
              ? `${user.first_name} ${user.last_name ?? ''}`.trim()
              : user.email}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={user.role === 'HOST' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
            {user.is_verified ? (
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                {t.profile.verified}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                {t.profile.notVerified}
              </Badge>
            )}
          </div>
        </div>
        {!isEditing && (
          <Button variant="outline" size="sm" className="ms-auto" onClick={() => setIsEditing(true)}>
            {t.profile.editProfile}
          </Button>
        )}
      </div>

      <Separator />

      {/* Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="first_name">{t.profile.firstName}</Label>
          {isEditing ? (
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder={t.profile.firstNamePlaceholder}
            />
          ) : (
            <p className="text-sm">{user.first_name ?? '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="last_name">{t.profile.lastName}</Label>
          {isEditing ? (
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder={t.profile.lastNamePlaceholder}
            />
          ) : (
            <p className="text-sm">{user.last_name ?? '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t.profile.email}</Label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone_number">{t.profile.phone}</Label>
          {isEditing ? (
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder={t.profile.phonePlaceholder}
            />
          ) : (
            <p className="text-sm">{user.phone_number ?? '—'}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t.profile.memberSince}</Label>
          <p className="text-sm text-muted-foreground">{memberSince}</p>
        </div>
      </div>

      {isEditing && (
        <>
          <Separator />
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? t.profile.saving : t.profile.save}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="flex-1">
              {t.profile.cancel}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
