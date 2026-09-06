// src/middleware/auth.js
// Ye middleware check karta hai ki request ke saath valid token aaya hai ya nahi.
// Agar valid hai to req.user mein user ki id daal deta hai, taaki routes ko
// user_id har jagah manually bhejne ki zaroorat na pade.

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required (token nahi mila)' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid ya expire ho gaya, dobara login karo' });
  }
}

module.exports = authMiddleware;