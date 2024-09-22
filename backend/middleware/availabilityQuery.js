import * as db from "../persistence/db.js";

const checkAvailability = async (req, res, next) => {
  const { roomId, startDate, endDate } = req.body;
  const bookingId = req.params.id ? parseInt(req.params.id) : null; // Default to null if not provided

  // Ensure that the required parameters are provided
  if (!roomId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Room ID, start date, and end date are required." });
  }

  //excluding the booking ID that i currently want to modify
  try {
    const availabilityQuery = `
        SELECT * FROM bookings 
        WHERE room_id = $1 
        AND ($2::int IS NULL OR booking_id != $2::int)
        AND status != 'cancelled'   
        AND (start_date, end_date) OVERLAPS ($3, $4)`;

    const result = await db.query(availabilityQuery, [
      roomId,
      bookingId,
      startDate,
      endDate,
    ]);

    if (result.rowCount > 0) {
      // Room is not available
      return res
        .status(400)
        .json({ error: "Room is already booked for these dates." });
    }

    // Room is available, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({ error: "Database error" });
  }
};

export default checkAvailability;

// Middleware to check room availability
// const checkAvailability = async (req, res, next) => {
//   const { roomId, startDate, endDate } = req.body;

//   // Ensure that the required parameters are provided
//   if (!roomId || !startDate || !endDate) {
//     return res
//       .status(400)
//       .json({ error: "Room ID, start date, and end date are required." });
//   }

//   try {
//     const availabilityQuery = `
//         SELECT * FROM bookings
//         WHERE room_id = $1
//         AND (start_date, end_date) OVERLAPS ($2, $3)`;

//     const result = await db.query(availabilityQuery, [
//       roomId,
//       startDate,
//       endDate,
//     ]);

//     if (result.rowCount > 0) {
//       // Room is not available
//       return res
//         .status(400)
//         .json({ error: "Room is already booked for these dates." });
//     }

//     // Room is available, proceed to the next middleware
//     next();
//   } catch (error) {
//     console.error("Error checking availability:", error);
//     return res.status(500).json({ error: "Database error" });
//   }
// };
