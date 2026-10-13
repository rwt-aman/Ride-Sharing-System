const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const ApiError = require("../utils/ApiError");

// Verifies "Authorization: Bearer <token>" and sets req.user.
// Identity always comes from here, never from the request body or query.
module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(header.split(" ")[1], JWT_SECRET, { algorithms: ["HS256"] });
    req.user = { studentId: payload.studentId };
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "Session expired, please log in again" : "Invalid token";
    next(new ApiError(401, message));
  }
};
