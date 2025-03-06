import type { NextConfig } from "next";

// Define environment variables with fallbacks for build time
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

// Make sure environment variables are available during build
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure image handling
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp']
  },
  
  // Enable standalone output mode for Docker deployment
  output: 'standalone',
  
  // Add any other valid Next.js configuration options here
};

export default nextConfig;
