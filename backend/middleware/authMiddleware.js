const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecret_railverse_jwt_key_123!@#', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Access Denied: Invalid Token' });
    }
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access Denied: Admin Privilege Required' });
  }
};

module.exports = { authenticateToken, authorizeAdmin };
