import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["unpdf", "pdfjs-dist"],
};

export default nextConfig;
