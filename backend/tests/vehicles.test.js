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
    .send({ username: 'reg_user', password: 'password123', role: 'user' });

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'reg_user', password: 'password123' });
  userToken = userLogin.body.token;

  await request(app)
    .post('/api/auth/register')
    .send({ username: 'admin_boss', password: 'password123', role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin_boss', password: 'password123' });
  adminToken = adminLogin.body.token;
});

test.beforeEach(() => {
  db.exec('DELETE FROM vehicles');
});

test('POST /api/vehicles - creates a vehicle with valid token', async () => {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      make: 'Toyota',
      model: 'Camry',
      category: 'Sedan',
      price: 25000,
      quantity: 5
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.make, 'Toyota');
  assert.strictEqual(res.body.model, 'Camry');
  assert.strictEqual(res.body.category, 'Sedan');
  assert.strictEqual(res.body.price, 25000);
  assert.strictEqual(res.body.quantity, 5);
  assert.ok(res.body.id);
});

test('POST /api/vehicles - rejects request without token', async () => {
  const res = await request(app)
    .post('/api/vehicles')
    .send({
      make: 'Honda',
      model: 'Civic',
      category: 'Sedan',
      price: 22000,
      quantity: 3
    });

  assert.strictEqual(res.status, 401);
});

test('POST /api/vehicles - rejects incomplete fields', async () => {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      make: 'Ford'
    });

  assert.strictEqual(res.status, 400);
});

test('GET /api/vehicles - returns all vehicles', async () => {
  await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Tesla', model: 'Model 3', category: 'Electric', price: 40000, quantity: 2 });

  await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'BMW', model: 'X5', category: 'SUV', price: 65000, quantity: 4 });

  const res = await request(app)
    .get('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.length, 2);
});

test('GET /api/vehicles/search - filters by category and price range', async () => {
  await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Ford', model: 'F-150', category: 'Truck', price: 35000, quantity: 3 });

  await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Honda', model: 'CR-V', category: 'SUV', price: 30000, quantity: 5 });

  const res = await request(app)
    .get('/api/vehicles/search?category=Truck&minPrice=30000&maxPrice=40000')
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].model, 'F-150');
});

test('PUT /api/vehicles/:id - updates vehicle details', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Audi', model: 'A4', category: 'Sedan', price: 38000, quantity: 2 });

  const vehicleId = created.body.id;

  const res = await request(app)
    .put(`/api/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Audi', model: 'A4 Quattro', category: 'Sedan', price: 42000, quantity: 4 });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.model, 'A4 Quattro');
  assert.strictEqual(res.body.price, 42000);
  assert.strictEqual(res.body.quantity, 4);
});

test('DELETE /api/vehicles/:id - fails for regular user', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ make: 'Mazda', model: 'CX-5', category: 'SUV', price: 28000, quantity: 1 });

  const res = await request(app)
    .delete(`/api/vehicles/${created.body.id}`)
    .set('Authorization', `Bearer ${userToken}`);

  assert.strictEqual(res.status, 403);
});

test('DELETE /api/vehicles/:id - succeeds for admin user', async () => {
  const created = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ make: 'Mazda', model: 'CX-5', category: 'SUV', price: 28000, quantity: 1 });

  const res = await request(app)
    .delete(`/api/vehicles/${created.body.id}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.message, 'Vehicle deleted successfully');
});
