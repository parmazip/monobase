/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  transpilePackages: ['@monobase/ui', '@monobase/sdk'],
  compiler: {
    // Remove console.log in production, keep console.error/warn for debugging
    removeConsole: {
      exclude: ['error', 'warn', 'info'],
    },
  },
}

export default nextConfig
