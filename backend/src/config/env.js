const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
if (isProd) required.push("BREVO_API_KEY");
if (isProd || process.env.BREVO_API_KEY) required.push("MAIL_FROM_EMAIL");

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

module.exports = {
  NODE_ENV,
  isProd,
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  // Comma-separated list, e.g. "http://localhost:5173,https://myapp.vercel.app"
  CLIENT_URLS: process.env.CLIENT_URL.split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || "",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "Ride Share",
};
