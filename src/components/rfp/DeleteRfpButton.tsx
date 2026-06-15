'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRfp } from '@/actions/rfp'
import { Button } from '@/components/ui/button'
import { getDictionary, type Locale } from '@/lib/i18n'

export function DeleteRfpButton({ rfpId, locale }: { rfpId: string; locale: Locale }) {
  const t = getDictionary(locale).rfp
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    startTransition(async () => {
      try {
        await deleteRfp(rfpId)
        toast.success(t.deleted)
        router.push('/rfp')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.deleteFailed)
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      {isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Trash2 className="me-2 h-4 w-4" />}
      {t.delete}
    </Button>
  )
}
