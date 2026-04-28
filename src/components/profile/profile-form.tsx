'use client'

import { useState } from 'react'
import { Locale, getDictionary } from '@/lib/i18n'

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
  onUpdate?: (data: any) => void
}

export default function ProfileForm({ locale, user, onUpdate }: ProfileFormProps) {
  const t = getDictionary(locale)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone_number: user.phone_number || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || t.profile.updateFailed)
      }

      setSuccess(true)
      setIsEditing(false)
      onUpdate?.(formData)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profile.updateFailed)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t.profile.profileUpdated}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t.profile.personalInfo}</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-violet-600 px-4 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-50"
          >
            {t.profile.editProfile}
          </button>
        )}
      </div>

      {/* Profile Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Section */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-200 to-blue-200">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name || 'User'}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {(user.first_name?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-600">{t.profile.avatar}</p>
              <p className="text-sm text-slate-500">
                {user.avatar_url ? 'Avatar uploaded' : 'No avatar uploaded'}
              </p>
            </div>
          </div>
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.firstName}</label>
          {isEditing ? (
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder={t.profile.firstNamePlaceholder}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
            />
          ) : (
            <p className="mt-2 text-slate-900">{user.first_name || '—'}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.lastName}</label>
          {isEditing ? (
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder={t.profile.lastNamePlaceholder}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
            />
          ) : (
            <p className="mt-2 text-slate-900">{user.last_name || '—'}</p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.email}</label>
          <p className="mt-2 text-slate-900">{user.email}</p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.phone}</label>
          {isEditing ? (
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder={t.profile.phonePlaceholder}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-500 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
            />
          ) : (
            <p className="mt-2 text-slate-900">{user.phone_number || '—'}</p>
          )}
        </div>

        {/* Account Type (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.accountType}</label>
          <p className="mt-2 text-slate-900">{user.role}</p>
        </div>

        {/* Email Verification Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <div className="mt-2 flex items-center gap-2">
            {user.is_verified ? (
              <>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-700">{t.profile.verified}</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-700">{t.profile.notVerified}</span>
              </>
            )}
          </div>
        </div>

        {/* Member Since (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700">{t.profile.memberSince}</label>
          <p className="mt-2 text-slate-900">
            {new Date(user.created_at).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {isEditing && (
        <div className="flex gap-3 border-t border-slate-200 pt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition disabled:opacity-50 hover:bg-violet-700"
          >
            {isSaving ? t.profile.saving : t.profile.save}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t.profile.cancel}
          </button>
        </div>
      )}
    </div>
  )
}
