const { PORT } = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
