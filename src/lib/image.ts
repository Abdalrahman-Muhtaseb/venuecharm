// Shared neutral blur placeholder for remote images loaded via next/image.
// next/image requires an explicit blurDataURL for remote sources; a tiny solid
// SVG matching the muted background gives a clean blur-up without per-image work.
const shimmer = (w: number, h: number) =>
  `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="#e5e7eb"/></svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str)

export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmer(8, 6))}`
