const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { isProd, CLIENT_URLS } = require("./config/env");
const { generalLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind a hosting proxy (Render, Railway...) req.ip would otherwise be the proxy's IP,
// and the rate limiter would treat every user as one person.
if (isProd || process.env.RENDER) app.set("trust proxy", 1);

app.use(helmet());

// Built-in allowed origins ensuring zero CORS breakage between Netlify and Render
const defaultOrigins = [
  "https://ride-sharing-system.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];
const allowedOrigins = Array.from(new Set([...CLIENT_URLS, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, health checks, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.trim().replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".netlify.app") ||
        cleanOrigin.endsWith(".vercel.app") ||
        cleanOrigin.endsWith(".onrender.com") ||
        !isProd
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(generalLimiter);

app.get("/", (req, res) => res.json({ message: "Ride Sharing API is running", status: "OK" }));

app.use("/api", require("./routes"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

module.exports = app;

