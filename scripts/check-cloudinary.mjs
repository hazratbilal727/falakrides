import {config} from "dotenv";
import {v2 as cloudinary} from "cloudinary";
config({path: ".env.local", quiet: true});
config({quiet: true});
const {CLOUDINARY_CLOUD_NAME: cloud_name, CLOUDINARY_API_KEY: api_key, CLOUDINARY_API_SECRET: api_secret} = process.env;
if (!cloud_name || !api_key || !api_secret) {
  console.error("Cloudinary environment variables are missing.");
  process.exitCode = 1;
} else {
  cloudinary.config({cloud_name, api_key, api_secret, secure: true});
  try {
    const result = await cloudinary.api.ping();
    if (result.status !== "ok") throw new Error("Unexpected response");
    console.log("Cloudinary connection verified. No media uploaded or changed.");
  } catch (error) {
    console.error("Cloudinary connection failed" + (error?.http_code ? ` (HTTP ${error.http_code})` : "") + ". Check the configured cloud name and API credentials.");
    process.exitCode = 1;
  }
}
