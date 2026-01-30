const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "healthy" });
  } catch {
    res.status(503).json({ status: "error", db: "unhealthy" });
  }
});

module.exports = app;
