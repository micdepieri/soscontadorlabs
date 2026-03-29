import type { NextConfig } from "next";

// Firebase App Hosting provides FIREBASE_WEBAPP_CONFIG at build time.
// Parse it to expose individual NEXT_PUBLIC_ vars for the client bundle.
const webAppConfig = process.env.FIREBASE_WEBAPP_CONFIG
  ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
  : {};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      webAppConfig.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      webAppConfig.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      webAppConfig.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      webAppConfig.storageBucket ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      webAppConfig.messagingSenderId ?? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      webAppConfig.appId ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
};

export default nextConfig;
