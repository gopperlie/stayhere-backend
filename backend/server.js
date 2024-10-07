import express from "express";
import cors from "cors";
import debugModule from "debug";
import adminRouter from "./controllers/AdminsController.js";
import propertyRouter from "./controllers/PropertiesController.js";
import roomRouter from "./controllers/RoomsController.js";
import customerRouter from "./controllers/CustomersController.js";
import bookingRouter from "./controllers/BookingsController.js";
import greetingHandler from "./routes/getGreeting.js";
import morgan from "morgan";

const debug = debugModule("app:server");

// const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000;

//supposed to pass parameters to cors and state which frontend URL
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//need this if i have HTML forms
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use("/api/admins", adminRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/customers", customerRouter);
app.use("/api/bookings", bookingRouter);

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.get("/api/greeting", greetingHandler);

app.listen(port, () => {
  debug(`stayhere listening on ${port}`);
});
