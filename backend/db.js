const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, 'test_dealership.db')
  : path.join(__dirname, 'dealership.db');

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  );
`);

if (process.env.NODE_ENV !== 'test') {
  const rowCount = db.prepare('SELECT count(*) as count FROM vehicles').get();
  if (rowCount.count === 0) {
    const insert = db.prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)');
    insert.run('Tesla', 'Model 3', 'Electric', 38990, 4);
    insert.run('Toyota', 'RAV4 Hybrid', 'SUV', 31725, 6);
    insert.run('Ford', 'Mustang GT', 'Coupe', 42495, 2);
    insert.run('Honda', 'Civic', 'Sedan', 23950, 8);
    insert.run('Porsche', '911 Carrera', 'Luxury', 114400, 1);
    insert.run('Chevrolet', 'Silverado 1500', 'Truck', 36800, 0);
  }
}

module.exports = db;
