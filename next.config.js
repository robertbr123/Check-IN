/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Necessário para Docker standalone build
  output: 'standalone',
}

module.exports = nextConfig
