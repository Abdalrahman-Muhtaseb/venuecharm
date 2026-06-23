// Shared event-type vocabulary used by both RFP requests (a single desired type)
// and venues (the set of event types a space suits). Keeping one source of truth
// is what lets Smart Matching compare an RFP's event type against a venue's.
export const eventTypes = [
  'WEDDING',
  'CONFERENCE',
  'BIRTHDAY',
  'CORPORATE',
  'PARTY',
  'WORKSHOP',
  'OTHER',
] as const

export type EventType = (typeof eventTypes)[number]
