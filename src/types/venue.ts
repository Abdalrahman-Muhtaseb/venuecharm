import { z } from 'zod'

function createOptionalBoundedNumber(min: number, max: number, message: string) {
  return z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }, z.number().refine((value) => value >= min && value <= max, message).optional())
}

export const createVenueSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.'),
  description: z.string().trim().max(3000).optional(),
  address: z.string().trim().min(3, 'Address is required.'),
  city: z.string().trim().min(2, 'City is required.'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
  latitude: createOptionalBoundedNumber(-90, 90, 'Latitude must be between -90 and 90.'),
  longitude: createOptionalBoundedNumber(-180, 180, 'Longitude must be between -180 and 180.'),
  pricePerHour: z.coerce.number().min(0).optional(),
  pricePerDay: z.coerce.number().min(0).optional(),
})

export type CreateVenueInput = z.infer<typeof createVenueSchema>

export type VenueStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED'
