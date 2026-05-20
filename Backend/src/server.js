const app = require("./app");
const connectDB = require("./config/db");
const setupCleanupTask = require("./tasks/cleanupExpiredDonations");
const { PORT } = require("./config/env");

// Connect to database
connectDB();

// Setup background tasks
setupCleanupTask();

// Start server
const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

// Initialize socket.io
const socket = require('./socket');
socket.init(server);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
