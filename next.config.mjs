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
    return [
      // Host portal moved under /host/* in session 15
      { source: '/dashboard', destination: '/host/dashboard', permanent: false },
      { source: '/listings', destination: '/host/listings', permanent: false },
      { source: '/listings/:path*', destination: '/host/listings/:path*', permanent: false },
      // Admin dev tools moved to /admin/tools in session 17
      { source: '/admin/dev', destination: '/admin/tools', permanent: false },
    ]
  },
}

export default nextConfig
