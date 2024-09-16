const express = require("express");
// const bodyParser = require("body-parser");

const app = express();
const port = 3000;

app.use(express.json());

//need this if i have HTML forms
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.listen(port, () => {
  console.log(`linproperties listening on port ${port}`);
});
