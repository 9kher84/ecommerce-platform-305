const jwt = require('jsonwebtoken');

function generateTestToken(userId, role, expiresIn = '1h') {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'supersecret12345678901234567890123',
    { expiresIn, jwtid: require('uuid').v4() }
  );
}

module.exports = {
  generateTestToken
};
