const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const scanRoutes = require("./routes/scan");
const emailRoutes = require("./routes/email");
const threatsRoutes = require("./routes/threats");
const reportsRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const settingsRoutes = require("./routes/settings");
const communityRoutes = require("./routes/community");
const reconRoutes = require("./routes/recon");
const gophishRoutes = require("./routes/gophish");
const pentestRoutes = require("./routes/pentest");
const vulnRoutes = require("./routes/vuln");
const yaraRoutes = require("./routes/yara");
const breachRoutes = require("./routes/breach");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/threats", threatsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/recon", reconRoutes);
app.use("/api/gophish", gophishRoutes);
app.use("/api/pentest", pentestRoutes);
app.use("/api/vuln", vulnRoutes);
app.use("/api/yara", yaraRoutes);
app.use("/api/breach", breachRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("[API ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;