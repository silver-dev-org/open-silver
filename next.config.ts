import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => {
    return [
      {
        source: "/mentors",
        destination: "https://silver.dev/mentors",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
