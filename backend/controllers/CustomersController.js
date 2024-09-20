import express from "express";
import * as db from "../persistence/db.js";
import { Router } from "express";
import debugModule from "debug";

const router = Router();
const debug = debugModule("app:customers");

// POST route to add new data
router.post("/add", async (req, res) => {
  const {
    family_name,
    given_name,
    email,
    phone_number,
    nationality,
    date_of_birth,
    gender,
  } = req.body;

  if (!family_name || !given_name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const query =
      "INSERT INTO customers (family_name, given_name, email, phone_number, nationality, date_of_birth, gender) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *";
    const values = [
      family_name,
      given_name,
      email,
      phone_number,
      nationality,
      date_of_birth,
      gender,
    ];
    const result = await db.query(query, values);

    res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/remove/:id", async (req, res) => {
  const cxid = parseInt(req.params.id);

  if (isNaN(cxid)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }

  try {
    // First, check if the customer exists
    const checkQuery = "SELECT * FROM customers WHERE customer_id = $1";
    const checkResult = await db.query(checkQuery, [cxid]);

    if (checkResult.rowCount === 0) {
      // If no rows were found, the customer does not exist
      return res.status(404).json({ error: "Customer not found" });
    }

    // Customer exists, proceed to delete
    const deleteQuery = "DELETE FROM customers WHERE customer_id = $1";
    await db.query(deleteQuery, [cxid]);

    res.status(200).send(`Customer deleted with ID: ${cxid}`);
  } catch (error) {
    console.error("Unable to delete customer:", error);
    res.status(500).json({ error: "Database error" });
  }
});

//nned to handle instances where certain fields are left out, no change should be made
router.put("/update/:id", async (req, res) => {
  const cxid = parseInt(req.params.id);

  if (isNaN(cxid)) {
    return res.status(400).json({ error: "Invalid customer ID" });
  }

  try {
    const checkQuery = "SELECT * FROM customers WHERE customer_id = $1";
    const checkResult = await db.query(checkQuery, [cxid]);

    if (checkResult.rowCount === 0) {
      // If no rows were found, the customer does not exist
      return res.status(404).json({ error: "Customer not found" });
    }
    const { gender, email } = req.body;
    const updateQuery =
      "UPDATE customers SET gender = $1, email = $2 WHERE customer_id = $3 RETURNING *";
    const result = await db.query(updateQuery, [gender, email, cxid]);
    res.status(200).json({
      message: `Customer ${cxid} updated successfully`,
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Unable to update customer:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
