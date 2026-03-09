require("dotenv").config();

const app = require("../backend/app");
const { connect } = require("../backend/db");

module.exports = async (req, res) => {
  try {
    await connect();
    return app(req, res);
  } catch (err) {
    console.error("❌ API handler xatosi:", err.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: err.message }));
  }
};

