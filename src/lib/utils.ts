import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guards against open-redirect: only allow same-origin relative paths.
export function isSafeRedirectPath(path: string | undefined | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('://')
}
