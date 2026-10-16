const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config(); // fallback to current working directory

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

const cleanVal = (val, prefix) => {
  if (!val) return "";
  let s = String(val).trim().replace(/^["']|["']$/g, "");
  if (prefix && s.startsWith(`${prefix}=`)) {
    s = s.slice(`${prefix}=`.length).trim().replace(/^["']|["']$/g, "");
  }
  return s;
};

const rawMongo =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  "";
const MONGO_URI = cleanVal(cleanVal(cleanVal(rawMongo, "MONGO_URI"), "MONGODB_URI"), "MONGO_URL");

const rawJwt =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_KEY ||
  "";
let JWT_SECRET = cleanVal(cleanVal(rawJwt, "JWT_SECRET"), "JWT_SECRET_KEY");

const missing = [];
if (!MONGO_URI) missing.push("MONGO_URI");
if (!JWT_SECRET) missing.push("JWT_SECRET");

if (missing.length > 0) {
  console.error(`FATAL ERROR: Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

const DEFAULT_CLIENT_URL =
  "https://ride-sharing-system-nine.vercel.app,https://ride-sharing-system.vercel.app,http://localhost:5173";
const CLIENT_URL_RAW = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

if (JWT_SECRET.length < 32) {
  console.warn("[WARN] JWT_SECRET is shorter than 32 characters; padding for security");
  JWT_SECRET = JWT_SECRET.padEnd(32, "0");
}

const CLIENT_URLS = CLIENT_URL_RAW.split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || "otpservice01@gmail.com";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Ride Share";

module.exports = {
  NODE_ENV,
  isProd,
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI,
  JWT_SECRET,
  CLIENT_URLS,
  BREVO_API_KEY,
  MAIL_FROM_EMAIL,
  MAIL_FROM_NAME,
};

