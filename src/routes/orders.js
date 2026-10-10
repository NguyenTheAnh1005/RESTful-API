const router = require('express').Router();
const db = require('../db');
const { createOrder } = require('../services/orders');
router.use(require('../middleware/auth'));
router.post('/', async (req, res) => res.status(201).json(await createOrder(req.uid, req.body?.items)));
router.param('id', (req, res, next, id) => {
  req.oid = Number(id);
  if (!Number.isSafeInteger(req.oid) || req.oid <= 0) return res.status(400).json({ error: 'Mã đơn không hợp lệ' });
  next();
});
router.get('/:id', async (req, res) => {
  const order = await db.order.findFirst({ where: { oid: req.oid, uid: req.uid }, include: { details: true } });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  res.json(order);
});
router.get('/:id/shipments', async (req, res) => {
  const order = await db.order.findFirst({ where: { oid: req.oid, uid: req.uid }, include: { shipments: true } });
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
  res.json(order.shipments);
});
module.exports = router;
