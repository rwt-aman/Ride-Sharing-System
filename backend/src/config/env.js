const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config(); // fallback to current working directory

const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// Safe fallbacks to guarantee zero downtime on Render / cloud hosts
const DEFAULT_MONGO_URI =
  "mongodb+srv://Amanrwt_17:root123@cluster0.uq8s7oh.mongodb.net/rideshare?retryWrites=true&w=majority&appName=Cluster0";
const DEFAULT_CLIENT_URL = "https://ride-sharing-system.netlify.app,http://localhost:5173";
const DEFAULT_JWT_SECRET = "rideshare_jwt_secret_production_key_minimum_32_characters_long";

const MONGO_URI = process.env.MONGO_URI || DEFAULT_MONGO_URI;
const CLIENT_URL_RAW = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
let JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

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

