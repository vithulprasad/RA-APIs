const jwt = require('jsonwebtoken')
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET ; // store in .env


// Create a token
exports.generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
};

// Verify token
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // invalid or expired
  }
};

exports.verifyTokenCheck = (token) => {
  try {
     const token_new = token.split(" ")[1];
    return jwt.verify(token_new, JWT_SECRET);
  } catch (error) {
    return null; // invalid or expired
  }
};


// Middleware for Express to protect routes
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }

  req.user = decoded; // store payload in req.user
  next();
};
