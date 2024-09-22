import jwt from "jsonwebtoken";

// Middleware to protect routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract the token

  if (!token)
    return res.status(401).json({ message: "Token missing or invalid" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token is not valid" });

    // Attach user data (from the token) to the request object
    req.user = user;
    next();
  });
};

export default verifyToken;
