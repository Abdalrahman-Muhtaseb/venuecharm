'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { completeOnboarding, skipOnboarding } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isValidILPhone } from '@/lib/phone'
import type { Locale } from '@/lib/i18n'

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {label}
    </Button>
  )
}

function SkipButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" className="w-full text-muted-foreground" disabled={pending}>
      {label}
    </Button>
  )
}

interface OnboardingFormProps {
  locale: Locale
  defaults: { firstName: string; lastName: string; phone: string; birthDate: string; bio: string }
  /** True when the provider (e.g. Google) gave no name — completion is then required. */
  nameMissing?: boolean
}

export function OnboardingForm({ locale, defaults, nameMissing = false }: OnboardingFormProps) {
  const isHe = locale === 'he'
  const [phoneErr, setPhoneErr] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const phone = new FormData(e.currentTarget).get('phone_number')?.toString().trim()
    if (phone && !isValidILPhone(phone)) {
      e.preventDefault()
      setPhoneErr(isHe ? 'מספר טלפון ישראלי לא תקין' : 'Invalid Israeli phone number')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={completeOnboarding} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">{isHe ? 'שם פרטי' : 'First name'}</Label>
            <Input id="first_name" name="first_name" defaultValue={defaults.firstName} required autoComplete="given-name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">{isHe ? 'שם משפחה' : 'Last name'}</Label>
            <Input id="last_name" name="last_name" defaultValue={defaults.lastName} required autoComplete="family-name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone_number">{isHe ? 'טלפון (אופציונלי)' : 'Phone (optional)'}</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              dir="ltr"
              defaultValue={defaults.phone}
              autoComplete="tel"
              placeholder="05X-XXXXXXX"
              onChange={() => phoneErr && setPhoneErr('')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="birth_date">{isHe ? 'תאריך לידה (אופציונלי)' : 'Birthday (optional)'}</Label>
            <Input id="birth_date" name="birth_date" type="date" defaultValue={defaults.birthDate} autoComplete="bday" />
          </div>
        </div>
        {phoneErr && <p className="-mt-2 text-xs text-destructive">{phoneErr}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">{isHe ? 'קצת עליי (אופציונלי)' : 'About me (optional)'}</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={defaults.bio}
            placeholder={isHe ? 'ספר/י קצת על עצמך...' : 'Tell others a little about yourself...'}
          />
        </div>
        <SaveButton label={isHe ? 'שמור והמשך' : 'Save & continue'} />
      </form>
      {!nameMissing && (
        <form action={skipOnboarding}>
          <SkipButton label={isHe ? 'דלג לעת עתה' : 'Skip for now'} />
        </form>
      )}
    </div>
  )
}
