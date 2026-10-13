const mongoose = require("mongoose");
const dns = require("dns");
const { MONGO_URI } = require("./env");

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
  } catch (err) {
    if (err.message && err.message.includes("querySrv")) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      await mongoose.connect(MONGO_URI);
    } else {
      throw err;
    }
  }
  console.log("MongoDB connected"); // never log the URI: it contains credentials
}

module.exports = connectDB;
