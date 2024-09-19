const express = require("express");
const cors = require("cors");
const pool = require("./persistence/db");
const debug = require("debug")("app:server");
const getGreeting = require("./routes/getGreeting");
const propertyRouter = require("./controllers/PropertiesController");
const customerRouter = require("./controllers/CustomersController");
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

app.use("/api/properties", propertyRouter);
app.use("/api/customers", customerRouter);

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.get("/api/greeting", getGreeting);

app.listen(port, () => {
  debug(`stayhere listening on port ${port}`);
});
