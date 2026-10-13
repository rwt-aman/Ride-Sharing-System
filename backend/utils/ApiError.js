// An error we throw on purpose, with the HTTP status to send.
// The central error handler turns it into { error: message }.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiError;
