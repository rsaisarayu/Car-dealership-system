const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_car_dealership_key_2026';

app.use(cors());
app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const userRole = role === 'admin' ? 'admin' : 'user';
  const hashedPassword = bcrypt.hashSync(password, 10);

  const insert = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
  const result = insert.run(username, hashedPassword, userRole);

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    username: username,
    role: userRole
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(200).json({
    token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

app.get('/api/vehicles/search', authenticateToken, (req, res) => {
  const { make, model, category, minPrice, maxPrice } = req.query;

  let sql = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (make) {
    sql += ' AND LOWER(make) LIKE ?';
    params.push(`%${make.toLowerCase()}%`);
  }

  if (model) {
    sql += ' AND LOWER(model) LIKE ?';
    params.push(`%${model.toLowerCase()}%`);
  }

  if (category) {
    sql += ' AND LOWER(category) = ?';
    params.push(category.toLowerCase());
  }

  if (minPrice) {
    sql += ' AND price >= ?';
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(Number(maxPrice));
  }

  sql += ' ORDER BY id DESC';

  const vehicles = db.prepare(sql).all(...params);
  res.json(vehicles);
});

app.get('/api/vehicles', authenticateToken, (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id DESC').all();
  res.json(vehicles);
});

app.post('/api/vehicles', authenticateToken, (req, res) => {
  const { make, model, category, price, quantity } = req.body;

  if (!make || !model || !category || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'All vehicle fields are required' });
  }

  if (Number(price) < 0 || Number(quantity) < 0) {
    return res.status(400).json({ message: 'Price and quantity must be non-negative' });
  }

  const insert = db.prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)');
  const result = insert.run(make, model, category, Number(price), Number(quantity));

  res.status(201).json({
    id: Number(result.lastInsertRowid),
    make,
    model,
    category,
    price: Number(price),
    quantity: Number(quantity)
  });
});

app.put('/api/vehicles/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { make, model, category, price, quantity } = req.body;

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  if (!make || !model || !category || price === undefined || quantity === undefined) {
    return res.status(400).json({ message: 'All vehicle fields are required' });
  }

  const update = db.prepare('UPDATE vehicles SET make = ?, model = ?, category = ?, price = ?, quantity = ? WHERE id = ?');
  update.run(make, model, category, Number(price), Number(quantity), id);

  res.json({
    id: Number(id),
    make,
    model,
    category,
    price: Number(price),
    quantity: Number(quantity)
  });
});

app.delete('/api/vehicles/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  res.json({ message: 'Vehicle deleted successfully' });
});

app.post('/api/vehicles/:id/purchase', authenticateToken, (req, res) => {
  const { id } = req.params;

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  if (vehicle.quantity <= 0) {
    return res.status(400).json({ message: 'Vehicle is out of stock' });
  }

  db.prepare('UPDATE vehicles SET quantity = quantity - 1 WHERE id = ?').run(id);
  const updatedVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

  res.json(updatedVehicle);
});

app.post('/api/vehicles/:id/restock', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const restockQty = Number(quantity);
  if (!quantity || isNaN(restockQty) || restockQty <= 0) {
    return res.status(400).json({ message: 'Valid positive restock quantity is required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  if (!vehicle) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  db.prepare('UPDATE vehicles SET quantity = quantity + ? WHERE id = ?').run(restockQty, id);
  const updatedVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);

  res.json(updatedVehicle);
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;
