/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  compress: true,
  async redirects() {
    // The host portal moved under /host/*. Keep old links/bookmarks working.
    return [
      { source: '/dashboard', destination: '/host/dashboard', permanent: false },
      { source: '/listings', destination: '/host/listings', permanent: false },
      { source: '/listings/:path*', destination: '/host/listings/:path*', permanent: false },
    ]
  },
}

export default nextConfig
