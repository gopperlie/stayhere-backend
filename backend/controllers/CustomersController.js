import express from "express";
import * as db from "../persistence/db.js";
import { Router } from "express";
import debugModule from "debug";
import verifyToken from "../middleware/verifyToken.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const debug = debugModule("app:customers");
const SALT_LENGTH = 12;

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

router.delete("/remove/:id", verifyToken, async (req, res) => {
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
router.put("/update/:id", verifyToken, async (req, res) => {
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

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const role = "customer";
  const client = await db.getClient();
  try {
    const result = await client.query(
      `SELECT username FROM users WHERE username = $1`,
      [email]
    ); //using email as username

    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken." });
    }

    //hashing pw
    const hashedPassword = await bcrypt.hash(password, SALT_LENGTH);

    // insert new admin
    await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)`,
      [email, hashedPassword, role]
    );

    const userResult = await client.query(
      `SELECT user_id FROM users WHERE username = $1`,
      [email]
    );

    const user = userResult.rows[0];

    const token = jwt.sign(
      { username: email, user_id: user.user_id, role: role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res
      .status(201)
      .json({ user: { user_id: user.user_id, username: email, role }, token });
  } catch (error) {
    console.error("Error during customer signup:", error);
    res.status(500).json({ message: "Error creating customer user", error });
  } finally {
    client.release();
  }
});

router.post("/getcustomerid", verifyToken, async (req, res) => {
  const email = req.body.email;
  try {
    const checkQuery = "SELECT customer_id FROM customers WHERE email = $1";
    const result = await db.query(checkQuery, [email]);
    // Check if a row was returned
    if (result.rows.length > 0) {
      const customerId = result.rows[0].customer_id;
      res.json({ customer_id: customerId });
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/cxlogin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      `SELECT username, password_hash, user_id, role FROM users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0]; // Get the first result row, different from mongodb

    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      const token = jwt.sign(
        { username: user.username, user_id: user.user_id, role: user.role }, // Payload
        process.env.JWT_SECRET,
        { expiresIn: "48h" }
      );

      return res.status(200).json({ token });
    } else {
      return res.status(400).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
