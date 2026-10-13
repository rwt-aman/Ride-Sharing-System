// Escapes regex metacharacters so user input is matched literally
// (prevents regex injection / ReDoS in $regex queries).
module.exports = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
