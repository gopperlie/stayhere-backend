import express from "express";
import * as db from "../persistence/db.js";
import { Router } from "express";
import debugModule from "debug";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const debug = debugModule("app:admins");
const SALT_LENGTH = 12;

//need to consider the fact that only authorised users are allowed to help other people register
router.post("/admin-signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      `SELECT username FROM admin_users WHERE username = $1`,
      [username]
    );
    //technically the coder can get the username and pw?
    debug(`${username}`);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken." });
    }

    //hashing pw
    const hashedPassword = await bcrypt.hash(password, SALT_LENGTH);

    // insert new admin
    await db.query(
      `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)`,
      [username, hashedPassword]
    );
    //create a separate route in frontend that brings user to log in, where JWT will be generated separately.
    res.status(201).json({ message: "Admin user created successfully!" });
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).json({ message: "Error creating admin user", error });
  }
});
router.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      `SELECT username, password_hash, admin_id FROM admin_users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0]; // Get the first result row, different from mongodb

    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      const token = jwt.sign(
        { username: user.username, admin_id: user.admin_id }, // Payload
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
