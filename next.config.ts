import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    // reactCompiler is being used as test disable if encounter memo any issues
    // reactCompiler: true,
  },
};

export default nextConfig;
