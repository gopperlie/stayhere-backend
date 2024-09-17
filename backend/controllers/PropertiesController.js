const express = require("express");
const pool = require("../persistence/db");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM properties");
    res.json(result.rows); // Send the fetched rows as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
