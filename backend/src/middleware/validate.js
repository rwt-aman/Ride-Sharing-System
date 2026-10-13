const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

// validate(schema) parses req.body with a zod schema. On success req.body is
// replaced with the cleaned data (trimmed, coerced, unknown keys removed).
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join(".");
    return next(new ApiError(400, field ? `${field}: ${issue.message}` : issue.message));
  }
  req.body = result.data;
  next();
};

// Used with router.param("id", validateObjectId) so a malformed id gives a
// 400 instead of a Mongoose CastError (500).
const validateObjectId = (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return next(new ApiError(400, "Invalid ID format"));
  next();
};

module.exports = { validate, validateObjectId };
