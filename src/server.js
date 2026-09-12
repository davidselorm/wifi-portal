require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const packageRoutes = require("./routes/packageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const { testConnection } = require("./config/db");

const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customer", customerRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "WiFi Portal API Running",
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build files (Single-server production mode)
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// Client-side SPA routing fallback for React Router (e.g. /dashboard, /admin, /login)
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  }

  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Frontend build not found. Please run 'npm run build' in the frontend directory.");
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  const isDbConnected = await testConnection();

  if (!isDbConnected) {
    console.warn("Database initialization issue.");
  }
});