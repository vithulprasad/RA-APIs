const jwt = require("jsonwebtoken");
const Admin_model = require("../models/Admin_model");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const authenticate = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(403)
          .json({ message: "Token expired, please login again" });
      }
      return res.status(403).json({ message: "Forbidden, please login" });
    }
    req.user = decoded;
    next();
  });
};
const check_admin = async (req, res, next) => {
  const user = req.user;
  const find_admin = await Admin_model.findOne({ _id: user });
  if (!find_admin) {
    res.status(404).json({ message: "access restricted you are not admin" });
  } else {
    next();
  }
};

module.exports = { generateToken, authenticate,check_admin };
