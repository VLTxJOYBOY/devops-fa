const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_12345');
    req.user = {
      id: decoded.id || decoded.userId,
      ...decoded
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_12345');
    req.user = {
      id: decoded.id || decoded.userId,
      ...decoded
    };
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
