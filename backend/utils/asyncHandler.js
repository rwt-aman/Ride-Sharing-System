// Forwards rejected promises to Express's error handler,
// so controllers don't need try/catch blocks.
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
