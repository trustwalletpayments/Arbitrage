/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow Vercel to complete the production build while the app is being migrated.
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
