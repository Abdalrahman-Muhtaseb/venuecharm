'use client'

import { CalendarX2, KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getDictionary, type Locale } from '@/lib/i18n'

interface ThingsToKnowProps {
  policy: 'FLEXIBLE' | 'MODERATE' | 'STRICT'
  rules: string | null
  capacity: number
  locale: Locale
}

function splitRules(rules: string | null): string[] {
  if (!rules) return []
  // Respect host line breaks; fall back to sentence splitting for single-line text.
  let lines = rules.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length <= 1) {
    lines = rules.split(/(?<=[.!?])\s+/).map((l) => l.trim()).filter(Boolean)
  }
  return lines
}

export function ThingsToKnow({ policy, rules, capacity, locale }: ThingsToKnowProps) {
  const isHe = locale === 'he'
  const c = getDictionary(locale).cancellation

  const policyLabel = policy === 'FLEXIBLE' ? c.flexible : policy === 'STRICT' ? c.strict : c.moderate
  const policyDesc = policy === 'FLEXIBLE' ? c.flexibleDesc : policy === 'STRICT' ? c.strictDesc : c.moderateDesc

  const capacityLine = isHe ? `עד ${capacity} אורחים` : `${capacity} guests maximum`
  const ruleLines = [...splitRules(rules), capacityLine]
  const previewLines = ruleLines.slice(0, 3)
  const learnMore = isHe ? 'מידע נוסף' : 'Learn more'

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold">{isHe ? 'מה כדאי לדעת' : 'Things to know'}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Cancellation policy */}
        <div>
          <CalendarX2 className="mb-3 h-6 w-6 text-foreground" aria-hidden="true" />
          <p className="font-medium">{c.policy}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{policyLabel}.</span> {policyDesc}.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="mt-2 text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {learnMore}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{c.policy}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <p className="font-medium text-foreground">{policyLabel}</p>
                <p className="text-muted-foreground">{policyDesc}</p>
                <p className="text-muted-foreground">
                  {isHe
                    ? 'ההחזר מחושב אוטומטית לפי מועד הביטול ביחס למועד האירוע.'
                    : 'Your refund is calculated automatically based on when you cancel relative to the event date.'}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* House rules */}
        <div>
          <KeyRound className="mb-3 h-6 w-6 text-foreground" aria-hidden="true" />
          <p className="font-medium">{isHe ? 'כללי הבית' : 'House rules'}</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
            {previewLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="mt-2 text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
              >
                {learnMore}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isHe ? 'כללי הבית' : 'House rules'}</DialogTitle>
              </DialogHeader>
              <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                {ruleLines.map((line, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
