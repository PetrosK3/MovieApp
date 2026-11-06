
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const db = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const COOKIE_NAME = "movieapp_token";
const SESSION_DURATION = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: COOKIE_MAX_AGE
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,50}$/.test(normalizedUsername)) {
      return res.status(400).json({
        message: "Username must contain 3-50 characters: letters, numbers or underscore."
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must contain between 8 and 72 characters."
      });
    }

    const existingUser = await db.User.findOne({
      where: {
        username: normalizedUsername
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username is already taken."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.User.create({
      username: normalizedUsername,
      passwordHash: passwordHash,
      role: "user"
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Username is already taken."
      });
    }

    return res.status(500).json({
      message: "Registration failed."
    });
  }
});

// LOGIN
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Server authentication configuration error."
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const user = await db.User.findOne({
      where: {
        username: normalizedUsername
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const token = jwt.sign(
      {
        sub: String(user.id)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: SESSION_DURATION
      }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed."
    });
  }
});

// CURRENT USER
router.get("/me", authMiddleware, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  });

  return res.json({
    message: "Logout successful."
  });
});

module.exports = router;
