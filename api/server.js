const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const morgan = require("morgan");
const pool = require("./db/db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = "3d";

// Generate JWT Token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      provider: user.provider,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

// Generate unique random username
async function generateUniqueUsername() {
  let username;
  let exists = true;

  while (exists) {
    const random = crypto.randomBytes(4).toString("hex").slice(0, 8);
    username = `user_${random}`;
    const check = await pool.query("SELECT 1 FROM users WHERE username = $1", [
      username,
    ]);
    exists = check.rowCount > 0;
  }

  return username;
}

// Create or update user in DB
async function upsertUser({ email, name, picture, provider, providerId }) {
  const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (existing.rowCount === 0) {
    const username = await generateUniqueUsername();

    const insert = await pool.query(
      `INSERT INTO users (email, name, picture, provider, provider_id, last_login, username)
       VALUES ($1, $2, $3, $4, $5, now(), $6)
       RETURNING *`,
      [email, name, picture, provider, providerId, username]
    );

    return insert.rows[0];
  } else {
    const update = await pool.query(
      `UPDATE users
       SET name = $2,
           picture = $3,
           provider = $4,
           provider_id = $5,
           last_login = now()
       WHERE email = $1
       RETURNING *`,
      [email, name, picture, provider, providerId]
    );

    return update.rows[0];
  }
}

// Middleware for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid or expired" });
    req.user = user;
    next();
  });
}

// Home Route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Amibara store" });
});

// Google Login
app.post("/api/google", async (req, res) => {
  const { idToken } = req.body;

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const { email, name, picture, sub } = response.data;

    const user = await upsertUser({
      email,
      name,
      picture,
      provider: "google",
      providerId: sub,
    });

    const token = generateToken(user);
    res.json({ success: true, user, token });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid Google ID token" });
  }
});

// 🔑 Facebook Login
app.post("/api/facebook", async (req, res) => {
  const { accessToken } = req.body;

  try {
    const response = await axios.get(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`
    );

    const { email, name, picture, id } = response.data;

    const user = await upsertUser({
      email,
      name,
      picture: picture?.data?.url || "",
      provider: "facebook",
      providerId: id,
    });

    const token = generateToken(user);
    res.json({ success: true, user, token });
  } catch (err) {
    console.error("Facebook auth error:", err);
    res.status(401).json({ error: "Invalid Facebook access token" });
  }
});

// Apple Login
app.post("/api/apple", async (req, res) => {
  const { idToken } = req.body;

  try {
    const decoded = jwt.decode(idToken, { complete: true });

    if (!decoded)
      return res.status(401).json({ error: "Invalid Apple ID token" });

    const { email, sub: appleId } = decoded.payload;

    const user = await upsertUser({
      email,
      name: "",
      picture: "",
      provider: "apple",
      providerId: appleId,
    });

    const token = generateToken(user);
    res.json({ success: true, user, token });
  } catch (err) {
    console.error("Apple auth error:", err);
    res.status(401).json({ error: "Invalid Apple ID token" });
  }
});

// Protected Route
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

//  Start Server
app.listen(3000, () => {
  console.log("Auth server running at http://localhost:3000");
});
