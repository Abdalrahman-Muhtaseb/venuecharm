'use client'

import { useFormStatus } from 'react-dom'
import { completeOnboarding, skipOnboarding } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  defaults: { firstName: string; lastName: string; phone: string }
}

export function OnboardingForm({ locale, defaults }: OnboardingFormProps) {
  const isHe = locale === 'he'
  return (
    <div className="flex flex-col gap-3">
      <form action={completeOnboarding} className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone_number">{isHe ? 'טלפון (אופציונלי)' : 'Phone (optional)'}</Label>
          <Input id="phone_number" name="phone_number" type="tel" defaultValue={defaults.phone} autoComplete="tel" />
        </div>
        <SaveButton label={isHe ? 'שמור והמשך' : 'Save & continue'} />
      </form>
      <form action={skipOnboarding}>
        <SkipButton label={isHe ? 'דלג לעת עתה' : 'Skip for now'} />
      </form>
    </div>
  )
}
