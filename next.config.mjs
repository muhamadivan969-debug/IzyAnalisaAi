/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mengaktifkan fitur kompilasi modern
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
