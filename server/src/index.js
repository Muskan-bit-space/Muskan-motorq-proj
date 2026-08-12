require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const telemetryRoutes = require("./routes/telemetryRoutes");
const ruleRoutes = require("./routes/ruleRoutes");
const alertRoutes = require("./routes/alertRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Telematics Alert Rule Engine",
    time: new Date().toISOString(),
  });
});

app.use("/api/v1/telemetry", telemetryRoutes);
app.use("/api/v1/rules", ruleRoutes);
app.use("/api/v1/alerts", alertRoutes);

// Basic 404 handler.
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Central error handler.
app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
