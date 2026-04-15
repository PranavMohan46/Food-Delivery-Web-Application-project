const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  const token = h && h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Login required" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware, JWT_SECRET };
