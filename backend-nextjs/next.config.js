/** @type {import('next').NextConfig} */
const nextConfig = {
  // This project is an API-only backend (no pages), consumed by the
  // separate Vite/React frontend. Keep server-only packages external so
  // they aren't bundled incorrectly for the Vercel serverless runtime.
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'mysql2', 'pg', 'xlsx'],
  },
}

module.exports = nextConfig
