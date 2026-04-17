/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any origin (for repo avatars, etc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Standalone output for Docker
  output: "standalone",
};

export default nextConfig;
