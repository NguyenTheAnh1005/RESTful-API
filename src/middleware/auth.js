const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Cần Bearer token' });
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const uid = Number(payload.sub);
    if (!Number.isSafeInteger(uid) || uid <= 0) throw new Error('Invalid subject');
    req.uid = uid;
    next();
  } catch { res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' }); }
};
