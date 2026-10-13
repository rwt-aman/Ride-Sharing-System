const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { isProd, CLIENT_URLS } = require("./config/env");
const { generalLimiter } = require("./middleware/rateLimiters");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Behind a hosting proxy (Render, Railway...) req.ip would otherwise be the proxy's IP,
// and the rate limiter would treat every user as one person.
if (isProd) app.set("trust proxy", 1);

app.use(helmet());
// Auth uses a Bearer header (not cookies), so no `credentials` option is needed
app.use(cors({ origin: CLIENT_URLS, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "100kb" }));
app.use(generalLimiter);

app.get("/", (req, res) => res.json({ message: "Ride Sharing API is running", status: "OK" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/rides", require("./routes/rideRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

module.exports = app;
