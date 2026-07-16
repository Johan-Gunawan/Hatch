import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / mammoth are CommonJS Node libs used only in the resume-upload
  // route handler; keep them external so the bundler doesn't try to trace/inline
  // their dynamic file reads.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
