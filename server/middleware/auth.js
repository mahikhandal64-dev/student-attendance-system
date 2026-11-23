const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'student-attendance-secret-key-2025-mahi-and-team';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Requires one of roles: ${roles.join(', ')} (Your role: ${req.user.role})` 
      });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  authenticate,
  requireRole
};
