const db = require('../db');
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
async function createOrder(uid, items) {
  if (!Array.isArray(items) || !items.length || items.some(i => !i || !Number.isSafeInteger(i.pid) || i.pid <= 0 || !Number.isSafeInteger(i.qty) || i.qty <= 0 || i.qty > 2147483647))
    fail(400, 'items phải chứa pid và qty là số nguyên dương');
  if (new Set(items.map(i => i.pid)).size !== items.length) fail(400, 'Không lặp sản phẩm trong một đơn');
  return db.$transaction(async tx => {
    const details = [];
    // Cùng thứ tự khóa sản phẩm để tránh các đơn đồng thời khóa chéo nhau.
    for (const item of [...items].sort((a, b) => a.pid - b.pid)) {
      const product = await tx.product.findUnique({ where: { pid: item.pid } });
      if (!product) fail(404, 'Không tìm thấy sản phẩm');
      const result = await tx.product.updateMany({ where: { pid: item.pid, quantity: { gte: item.qty } }, data: { quantity: { decrement: item.qty } } });
      if (!result.count) fail(409, 'Sản phẩm không đủ tồn kho');
      details.push({ pid: item.pid, qty: item.qty, unit_price: product.price });
    }
    return tx.order.create({ data: { uid, details: { create: details }, shipments: { create: { status: 'pending' } } }, include: { details: true, shipments: true } });
  });
}
module.exports = { createOrder };
