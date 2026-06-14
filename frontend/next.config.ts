import type { NextConfig } from "next";

const backendOrigin = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/api\/?$/i, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  allowedDevOrigins: [
    "192.168.56.1",
    "localhost",
    "127.0.0.1"
  ],

  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: `${backendOrigin}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;