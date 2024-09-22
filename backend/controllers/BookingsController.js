import * as db from "../persistence/db.js";
import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM bookings");
    res.json(result.rows); // Send the fetched rows as JSON
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/check-availability", async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const result = await db.query(
      `
      SELECT room_id
      FROM rooms
      WHERE room_id NOT IN (
        SELECT room_id 
        FROM bookings
        WHERE (start_date, end_date) OVERLAPS ($1, $2)
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

router.post("/new", async (req, res) => {
  const { roomId, customerId, startDate, endDate } = req.body;

  //always use YYYY-MM-DD for dates to avoid ambiguity
  try {
    // Ensure the room is still available before booking
    const result = await db.query(
      `
      SELECT room_id 
      FROM bookings 
      WHERE room_id = $1 
      AND (start_date, end_date) OVERLAPS ($2, $3)`,
      [roomId, startDate, endDate]
    );

    if (result.rows.length === 0) {
      await db.query(
        `
        INSERT INTO bookings (room_id, customer_id, start_date, end_date)
        VALUES ($1, $2, $3, $4)`,
        [roomId, customerId, startDate, endDate]
      );

      res.status(200).json({ message: "Room booked successfully!" });
    } else {
      res
        .status(400)
        .json({ message: "Room is already booked for these dates." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error booking the room", error });
  }
});

export default router;
