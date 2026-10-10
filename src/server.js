require('dotenv').config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');
const express = require('express');
const db = require('./db');
const app = express();
app.use(express.json());
app.get('/health', async (req, res) => {
  try { await db.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'up' }); }
  catch { res.status(503).json({ status: 'error', database: 'down' }); }
});
app.use('/auth', require('./routes/auth'));
app.use('/orders', require('./routes/orders'));
app.use((req, res) => res.status(404).json({ error: 'Không tìm thấy API' }));
app.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Lỗi hệ thống' : err.message });
});
const server = app.listen(Number(process.env.PORT || 3002), '0.0.0.0', () => console.log('Lab 2 API listening'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await db.$disconnect(); process.exit(0); }));
