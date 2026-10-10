const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const publicUser = { uid: true, username: true, fullname: true, role: true, membership: true };
router.post('/register', async (req, res) => {
  const { username, fullname, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || username.length > 50 ||
      typeof fullname !== 'string' || !fullname.trim() || fullname.length > 100 ||
      typeof password !== 'string' || !password || Buffer.byteLength(password) > 72)
    return res.status(400).json({ error: 'username, fullname, password thiếu hoặc không hợp lệ (mật khẩu tối đa 72 byte)' });
  const role = await db.role.findFirstOrThrow({ where: { rolename: 'normal' } });
  const membership = await db.memberShip.findFirstOrThrow({ where: { mname: 'normal', score: 10 } });
  const user = await db.user.create({ data: { username: username.trim(), fullname: fullname.trim(),
    password: await bcrypt.hash(password, 10), roleid: role.roleid, mid: membership.mid }, select: publicUser });
  res.status(201).json(user);
});
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Cần username và password' });
  const user = await db.user.findUnique({ where: { username: username.trim() } });
  if (!user || !await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.uid), algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
  res.json({ token });
});
module.exports = router;
