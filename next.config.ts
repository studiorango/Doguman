import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/image: 외부 이미지 호스트 허용
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
