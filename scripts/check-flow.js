// Kiểm tra luồng tích hợp trên database thật; tạo một tài khoản và một đơn demo.
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://localhost:3002';
const [pidX, pidY] = process.argv.slice(2).map(Number);
if (!pidX || !pidY) throw new Error('Cách chạy: node scripts/check-flow.js <pidX> <pidY>');
async function request(method, path, body, token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
(async () => {
  assert.equal((await request('GET', '/health')).status, 200);
  const account = { username: `check_${Date.now()}`, fullname: 'Lab 2 verification', password: 'Lab2_verify_123' };
  const registered = await request('POST', '/auth/register', { ...account, roleid: 999, mid: 999 });
  assert.equal(registered.status, 201);
  assert.equal(registered.data.role.rolename, 'normal');
  assert.equal(registered.data.membership.score, 10);
  assert.equal(registered.data.password, undefined);
  assert.equal((await request('POST', '/auth/register', account)).status, 409);
  assert.equal((await request('POST', '/auth/login', { ...account, password: 'wrong' })).status, 401);
  const login = await request('POST', '/auth/login', account);
  assert.equal(login.status, 200);
  const token = login.data.token;
  assert.ok(token);
  const orderBody = { items: [{ pid: pidX, qty: 2 }, { pid: pidY, qty: 5 }] };
  assert.equal((await request('POST', '/orders', orderBody)).status, 401);
  assert.equal((await request('POST', '/orders', orderBody, 'invalid')).status, 401);
  assert.equal((await request('POST', '/orders', { items: [{ pid: pidX, qty: -1 }] }, token)).status, 400);
  // X được trừ trước, Y thiếu tồn kho: cả giao dịch phải rollback (kiểm tra thêm bằng SQL).
  assert.equal((await request('POST', '/orders', { items: [{ pid: pidX, qty: 2 }, { pid: pidY, qty: 2147483647 }] }, token)).status, 409);
  const before = Date.now();
  const created = await request('POST', '/orders', orderBody, token);
  assert.equal(created.status, 201);
  assert.equal(created.data.uid, registered.data.uid);
  assert.deepEqual(created.data.details.map(i => [i.pid, i.qty]), [[pidX, 2], [pidY, 5]]);
  assert.ok(Date.parse(created.data.createat) >= before - 1000);
  assert.equal(created.data.shipments.length, 1);
  const oid = created.data.oid;
  assert.equal((await request('GET', `/orders/${oid}`, null, token)).data.details.length, 2);
  assert.equal((await request('GET', `/orders/${oid}/shipments`, null, token)).data[0].oid, oid);
  const second = { ...account, username: account.username + '_other' };
  assert.equal((await request('POST', '/auth/register', second)).status, 201);
  const otherToken = (await request('POST', '/auth/login', second)).data.token;
  assert.equal((await request('GET', `/orders/${oid}`, null, otherToken)).status, 404);
  assert.equal((await request('GET', `/orders/${oid}/shipments`, null, otherToken)).status, 404);
  console.log(JSON.stringify({ result: 'PASS', username: account.username, oid, pidX, pidY, expectedQuantity: { X: 18, Y: 15 } }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
