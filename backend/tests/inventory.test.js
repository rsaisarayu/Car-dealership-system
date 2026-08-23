process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_123';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const db = require('../db');

let userToken;
let adminToken;

test.before(async () => {
  db.exec('DELETE FROM users');

  await request(app)
    .post('/api/auth/register')
    .send({ username: 'buyer_user', password: 'password123', role: 'user' });

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'buyer_user', password: 'password123' });
  userToken = userLogin.body.token;

  await request(app)
    .post('/api/auth/register')
    .send({ username: 'stock_admin', password: 'password123', role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'stock_admin', password: 'password123' });
  adminToken = adminLogin.body.token;
});

test.beforeEach(() => {
  db.exec('DELETE FROM vehicles');
});

test('POST /api/vehicles/:id/purchase - reduces stock quantity by 1', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 20000, quantity: 3 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .post(`/api/vehicles/${vehicleId}/purchase`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.quantity, 2);
});

test('POST /api/vehicles/:id/purchase - fails when vehicle is out of stock', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Nissan', model: 'Leaf', category: 'Electric', price: 28000, quantity: 0 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .post(`/api/vehicles/${vehicleId}/purchase`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.message, 'Vehicle is out of stock');
});

test('POST /api/vehicles/:id/purchase - returns 404 for non-existent vehicle', async () => {
  const res = await request(app)
    .post('/api/vehicles/9999/purchase')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 404);
});

test('POST /api/vehicles/:id/restock - increases quantity for admin user', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Ford', model: 'Mustang', category: 'Coupe', price: 55000, quantity: 2 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .post(`/api/vehicles/${vehicleId}/restock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 5 });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.quantity, 7);
});

test('POST /api/vehicles/:id/restock - rejects regular user with 403', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Ford', model: 'Mustang', category: 'Coupe', price: 55000, quantity: 2 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .post(`/api/vehicles/${vehicleId}/restock`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ quantity: 5 });

  assert.strictEqual(res.status, 403);
});

test('POST /api/vehicles/:id/restock - rejects invalid restock amount', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Ford', model: 'Mustang', category: 'Coupe', price: 55000, quantity: 2 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .post(`/api/vehicles/${vehicleId}/restock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: -3 });

  assert.strictEqual(res.status, 400);
});
