import * as db from "../persistence/db.js";

const checkCancelledRoom = async (req, res, next) => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    const checkQuery = "SELECT * FROM bookings WHERE booking_id = $1";
    const checkResult = await db.query(checkQuery, [bookingId]);

    if (
      checkResult.rowCount === 0 ||
      checkResult.rows[0].status === "cancelled"
    ) {
      // If no rows were found, the booking does not exist
      return res
        .status(404)
        .json({ error: "Booking has already been cancelled / not found" });
    }
    next();
  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({ error: "Database error" });
  }
};

export default checkCancelledRoom;
