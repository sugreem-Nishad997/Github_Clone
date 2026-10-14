import AWS from "aws-sdk";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from current folder, package folder, or user home folder
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(os.homedir(), ".apnagit.env") });

const s3Config = {
  signatureVersion: "v4",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.awsAccess || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.awsPass || process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.r || process.env.AWS_REGION || "auto",
};

if (process.env.CLOUDFLARE_ACCOUNT_ID) {
  s3Config.endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

const s3 = new AWS.S3(s3Config);

const S3_BUCKET =
  process.env.R2_BUCKET ||
  process.env.S3_BUCKET ||
  process.env.bucket ||
  process.env.BUCKET;

export { s3, S3_BUCKET };
