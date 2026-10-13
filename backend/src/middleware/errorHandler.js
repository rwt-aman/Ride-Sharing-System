const ApiError = require("../utils/ApiError");

// The single place where errors become HTTP responses.
// Unexpected errors are logged server-side and never leaked to the client.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request body too large" });
  if (err.code === 11000) return res.status(409).json({ error: "This record already exists" });
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: Object.values(err.errors)[0].message });
  }
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid ID format" });

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
