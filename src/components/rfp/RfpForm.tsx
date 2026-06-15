'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { createRfp } from '@/actions/rfp'
import { AmenitiesPicker } from '@/components/venue/AmenitiesPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, type Locale } from '@/lib/i18n'
import { eventTypes } from '@/types/rfp'

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}

export function RfpForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).rfp
  const [amenities, setAmenities] = useState<string[]>([])

  return (
    <form action={createRfp} className="mt-6 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="eventType">{t.eventType}</Label>
          <select id="eventType" name="eventType" defaultValue="WEDDING" className={selectClass}>
            {eventTypes.map((et) => (
              <option key={et} value={et}>
                {t.eventTypeOptions[et]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="eventDate">{t.eventDate}</Label>
          <Input id="eventDate" name="eventDate" type="date" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="capacity">{t.capacity}</Label>
          <Input id="capacity" name="capacity" type="number" min={1} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">{t.budget}</Label>
          <Input id="budget" name="budget" type="number" min={1} step="1" required />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">{t.amenities}</h2>
          <p className="text-sm text-muted-foreground">{t.amenitiesHint}</p>
        </div>
        <AmenitiesPicker locale={locale} selected={amenities} onChange={setAmenities} />
        <input type="hidden" name="amenities" value={amenities.join(',')} />
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="description">{t.description}</Label>
        <Textarea id="description" name="description" rows={4} placeholder={t.descriptionPlaceholder} />
      </section>

      <SubmitButton label={t.submit} pendingLabel={t.submitting} />
    </form>
  )
}
