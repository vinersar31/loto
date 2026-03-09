import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/loto" : "",
};

export default nextConfig;
