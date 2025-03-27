import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Determine the backend URL based on the environment
    const isProduction = process.env.NODE_ENV === 'production';
    // const backendHost = process.env.NEXT_PUBLIC_BACKENDHOST || 'localhost:8000'; // Default for non-Docker dev
    // Updated: Add logging and ensure backendHost is set correctly
    const backendHost = process.env.NEXT_PUBLIC_BACKENDHOST || 'localhost:8000'; // Default for non-Docker dev
    console.log('Backend Host:', backendHost); // Debug: Log the backend host

    // Backend URL for proxying
    // const backendUrl = isProduction
    //   ? 'https://vowerp.co.in' // Production backend URL
    //   : `http://${backendHost}/api`; // Development (localhost or Docker service)
    // Updated: Add logging for backendUrl and ensure proper URL construction
    const backendUrl = isProduction
      ? 'https://vowerp.co.in' // Production backend URL
      : `${backendHost}/api`; // Development (localhost or Docker service)
    console.log('Backend URL for proxy:', backendUrl); // Debug: Log the constructed backend URL

    // Only apply the proxy in development
    if (isProduction) {
      return [];
    }

    return [
      {
        source: '/api/:path*', // Match all /api/* requests
        destination: `${backendUrl}/:path*`, // Proxy to backend
      },
    ];
  },

  // Optional: Ensure Next.js works with your domain setup
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;