// Israeli phone validation + normalization. Accepts mobile (05X), VoIP (07X) and
// landline (02/03/04/08/09) numbers, with or without the +972 country code and
// common separators. `normalizeILPhone` returns the canonical E.164 form
// (+9725XXXXXXXX) or null when the input isn't a valid Israeli number.

const MOBILE_RE = /^05\d{8}$/ // 05X + 7 subscriber digits → 10 digits
const VOIP_RE = /^07\d{8}$/ // 07X VoIP → 10 digits
const LANDLINE_RE = /^0[23489]\d{7}$/ // area code + 7 digits → 9 digits

/** Canonical E.164 (`+9725XXXXXXXX`) for a valid IL number, else null. */
export function normalizeILPhone(raw: string): string | null {
  if (!raw) return null

  let s = raw.trim().replace(/[\s\-().]/g, '').replace(/^\+/, '')
  if (s.startsWith('00972')) s = '0' + s.slice(5)
  else if (s.startsWith('972')) s = '0' + s.slice(3)

  if (!/^\d+$/.test(s)) return null
  if (!(MOBILE_RE.test(s) || VOIP_RE.test(s) || LANDLINE_RE.test(s))) return null

  return '+972' + s.slice(1)
}

export function isValidILPhone(raw: string): boolean {
  return normalizeILPhone(raw) !== null
}
