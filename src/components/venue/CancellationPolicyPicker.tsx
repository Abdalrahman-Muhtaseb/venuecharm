'use client'

import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cancellationPolicies, type CancellationPolicy } from '@/types/venue'
import { getDictionary, type Locale } from '@/lib/i18n'

interface CancellationPolicyPickerProps {
  locale: Locale
  defaultValue?: CancellationPolicy
  name?: string
}

export function CancellationPolicyPicker({
  locale,
  defaultValue = 'MODERATE',
  name = 'cancellationPolicy',
}: CancellationPolicyPickerProps) {
  const [value, setValue] = useState<CancellationPolicy>(defaultValue)
  const t = getDictionary(locale).cancellation

  const descriptions: Record<CancellationPolicy, string> = {
    FLEXIBLE: t.flexibleDesc,
    MODERATE: t.moderateDesc,
    STRICT: t.strictDesc,
  }
  const labels: Record<CancellationPolicy, string> = {
    FLEXIBLE: t.flexible,
    MODERATE: t.moderate,
    STRICT: t.strict,
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>{t.policy}</Label>
      <input type="hidden" name={name} value={value} />
      <RadioGroup
        value={value}
        onValueChange={(v) => setValue(v as CancellationPolicy)}
        className="grid gap-2 md:grid-cols-3"
      >
        {cancellationPolicies.map((policy) => (
          <label
            key={policy}
            htmlFor={`policy-${policy}`}
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition ${
              value === policy ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem id={`policy-${policy}`} value={policy} />
              <span className="text-sm font-medium">{labels[policy]}</span>
            </div>
            <p className="text-xs text-muted-foreground">{descriptions[policy]}</p>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}
