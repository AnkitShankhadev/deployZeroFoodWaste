const express = require("express");
const cors = require("cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { FRONTEND_URL, NODE_ENV } = require("./config/env");
const connectDB = require("./config/db");
connectDB(); // ✅ Add this

// ...rest of your middleware and routes
// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");
const matchingRoutes = require("./routes/matchingRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statsRoutes = require("./routes/statsRoutes");

const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// ✅ FIX: Proper CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ];

    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    auth: req.headers.authorization ? "Bearer ***" : "None",
    body: req.method !== "GET" ? Object.keys(req.body) : undefined,
  });
  next();
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "ZeroFoodWaste API is running 🚀" });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

// Test auth endpoint
app.get("/api/test-auth", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  res.json({
    success: true,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 10)}...` : null,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
