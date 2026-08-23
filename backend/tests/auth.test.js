process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_123';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const db = require('../db');

test.beforeEach(() => {
  db.exec('DELETE FROM users');
});

test('POST /api/auth/register - successfully registers a regular user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'john_doe',
      password: 'password123'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.username, 'john_doe');
  assert.strictEqual(res.body.role, 'user');
  assert.strictEqual(res.body.password, undefined);
});

test('POST /api/auth/register - registers an admin user', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      username: 'admin_user',
      password: 'adminpassword',
      role: 'admin'
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.username, 'admin_user');
  assert.strictEqual(res.body.role, 'admin');
});

test('POST /api/auth/register - rejects missing username or password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'missing_pass' });

  assert.strictEqual(res.status, 400);
});

test('POST /api/auth/register - rejects duplicate username', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'duplicate_user', password: 'password123' });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'duplicate_user', password: 'password456' });

  assert.strictEqual(res.status, 400);
});

test('POST /api/auth/login - successfully logs in and returns a token', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'login_user', password: 'password123' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'login_user', password: 'password123' });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.username, 'login_user');
  assert.strictEqual(res.body.user.role, 'user');
});

test('POST /api/auth/login - fails with incorrect password', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'wrong_pass_user', password: 'correct_password' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'wrong_pass_user', password: 'wrong_password' });

  assert.strictEqual(res.status, 401);
});
