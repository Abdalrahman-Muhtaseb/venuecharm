import { z } from 'zod'
import { eventTypes, type EventType } from './event-types'

export { eventTypes }
export type { EventType }

export const createRfpSchema = z.object({
  eventType: z.enum(eventTypes).default('OTHER'),
  eventDate: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().optional(),
  ),
  city: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(120).optional(),
  ),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
  budget: z.coerce.number().min(1, 'Budget must be greater than 0.'),
  description: z.string().trim().max(2000).optional(),
})

export type CreateRfpInput = z.infer<typeof createRfpSchema>
