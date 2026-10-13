import type {NextConfig} from "next";
const nextConfig:NextConfig = {distDir: process.env.NEXT_DIST_DIR || ".next", images:{remotePatterns:[{protocol:"https",hostname:"images.unsplash.com"}, ...(process.env.CLOUDINARY_CLOUD_NAME ? [{protocol: "https" as const, hostname: "res.cloudinary.com", pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/**`}] : [])]}};
export default nextConfig;
