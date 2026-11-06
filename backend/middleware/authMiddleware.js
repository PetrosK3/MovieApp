
const jwt = require("jsonwebtoken");
const db = require("../models");

const COOKIE_NAME = "movieapp_token";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Server authentication configuration error."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(decoded.sub, {
      attributes: ["id", "username", "role", "isActive"]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid or inactive account."
      });
    }

    req.user = user;

    next();

  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired session."
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed."
    });
  }
};

module.exports = authMiddleware;
