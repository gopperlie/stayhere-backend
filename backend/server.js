const express = require("express");
const cors = require("cors");
const pool = require("./persistence/db");
const getGreeting = require("./routes/getGreeting");
// const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

//need this if i have HTML forms
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/properties", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM properties");
    res.json(result.rows); // Send the fetched rows as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.get("/api/greeting", getGreeting);

app.listen(port, () => {
  console.log(`linproperties listening on port ${port}`);
});
