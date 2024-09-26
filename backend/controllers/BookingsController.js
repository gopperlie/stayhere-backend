import checkAvailability from "../middleware/availabilityQuery.js";
import verifyToken from "../middleware/verifyToken.js";
import * as db from "../persistence/db.js";
import debugModule from "debug";
import express from "express";
import getDateInSingapore from "../helperfunctions/getDateWithoutTime.js";
import checkCancelledRoom from "../middleware/checkCancelledRoom.js";
const router = express.Router();
const debug = debugModule("app:bookings");

router.get("/", verifyToken, async (req, res) => {
  let client;
  try {
    client = await db.getClient();
    const result = await client.query("SELECT * FROM bookings");
    res.json(result.rows); // Send the fetched rows as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  } finally {
    if (client) {
      client.release();
    }
  }
});

//get specific booking
router.get("/:id", verifyToken, async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);

  if (isNaN(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    const checkQuery = "SELECT * FROM bookings WHERE booking_id = $1";
    const result = await db.query(checkQuery, [bookingId]);
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.post("/check-available-rooms", async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM rooms
      WHERE room_id NOT IN (
        SELECT room_id 
        FROM bookings
        WHERE (start_date, end_date) OVERLAPS ($1, $2)
        AND status != 'cancelled'
      )`,
      [startDate, endDate]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ availableRooms: result.rows });
    } else {
      res
        .status(400)
        .json({ message: "No rooms available for the selected dates." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error checking availability", error });
  }
});

router.post("/new", checkAvailability, async (req, res) => {
  const { roomId, customerId, startDate, endDate } = req.body;

  //always use YYYY-MM-DD for dates to avoid ambiguity
  try {
    const insertQuery = `
      INSERT INTO bookings (room_id, customer_id, start_date, end_date) 
      VALUES ($1, $2, $3, $4) RETURNING *`;

    const result = await db.query(insertQuery, [
      roomId,
      customerId,
      startDate,
      endDate,
    ]);
    res.status(201).json({
      message: "Reservation created successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Unable to create reservation:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//Modify reservations. Authenticated user can modify rooms, customers, start and/or end dates.
//consider validating if customer / room exists before posting the query to db
router.put(
  "/modify/:id",
  verifyToken,
  checkCancelledRoom,
  checkAvailability,
  async (req, res) => {
    const bookingId = parseInt(req.params.id);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }
    const checkQuery = "SELECT * FROM bookings WHERE booking_id = $1";
    const checkResult = await db.query(checkQuery, [bookingId]);

    try {
      const { roomId, customerId, startDate, endDate } = req.body;
      if (!roomId || !customerId || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const originalBooking = checkResult.rows[0];

      // Normalize both incoming and stored dates to Singapore timezone
      const normalizedStartDate = getDateInSingapore(startDate);
      const normalizedEndDate = getDateInSingapore(endDate);
      debug(normalizedStartDate);

      const originalStartDate = getDateInSingapore(originalBooking.start_date);
      const originalEndDate = getDateInSingapore(originalBooking.end_date);
      debug(originalStartDate);
      // Compare only the date parts (ignoring time)
      if (
        originalStartDate === normalizedStartDate &&
        originalEndDate === normalizedEndDate
      ) {
        return res.status(400).json({
          error: "There were no changes to the start and end dates.",
        });
      }

      const updateQuery =
        "UPDATE bookings SET room_id = $2, customer_id = $3, start_date = $4, end_date = $5 WHERE booking_id = $1 RETURNING *";

      // Use the correct variables here
      const result = await db.query(updateQuery, [
        bookingId,
        roomId,
        customerId,
        startDate,
        endDate,
      ]);
      res.status(200).json({
        message: `Booking ${bookingId} updated successfully`,
        booking: result.rows[0], // Return the updated booking details
      });
    } catch (error) {
      console.error("Unable to update booking:", error);
      res.status(500).json({ error: "Database error" });
    }
  }
);

//Route for cancelling a booking, allow for future flexibility of other statuses
router.put("/cancel/:id", verifyToken, checkCancelledRoom, async (req, res) => {
  const bookingId = parseInt(req.params.id);

  if (isNaN(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    const { status = "cancelled" } = req.body;

    const updateQuery =
      "UPDATE bookings SET status = $2 WHERE booking_id = $1 RETURNING *";

    // Use the correct variables here
    const result = await db.query(updateQuery, [bookingId, status]);
    res.status(200).json({
      message: `Status of booking ${bookingId} updated successfully`,
      booking: result.rows[0], // Return the updated booking details
    });
  } catch (error) {
    console.error("Unable to update booking:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
