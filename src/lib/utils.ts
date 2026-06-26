import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guards against open-redirect: only allow same-origin relative paths.
export function isSafeRedirectPath(path: string | undefined | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('://')
}

// Round a count down to a clean "social proof" figure (shown with a trailing "+"):
// nearest 10 under 100, nearest 100 otherwise. Values under 10 are left exact.
export function approxCount(n: number): number {
  if (n < 10) return n
  if (n < 100) return Math.floor(n / 10) * 10
  return Math.floor(n / 100) * 100
}
