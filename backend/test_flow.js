const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // STEP 1: create schema (same as my app)
  db.run('CREATE TABLE IF NOT EXISTS pathologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, phone TEXT, email TEXT, website TEXT, rating REAL DEFAULT 0, total_reviews INTEGER DEFAULT 0, opening_hours TEXT, about TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS tests (id INTEGER PRIMARY KEY AUTOINCREMENT, pathology_id INTEGER NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, description TEXT, turnaround_time TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (pathology_id) REFERENCES pathologies(id) ON DELETE CASCADE)');
  db.run('CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, pathology_id INTEGER NOT NULL, user_name TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (pathology_id) REFERENCES pathologies(id) ON DELETE CASCADE)');

  // STEP 2: seed some data (simplified)
  db.run('INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)', ['Lab1', 'Addr1', 12.0, 77.0]);
  console.log('After seed insert 1:', JSON.stringify(db.exec('SELECT last_insert_rowid(), changes()')));

  db.run('INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)', ['Lab2', 'Addr2', 13.0, 78.0]);
  console.log('After seed insert 2:', JSON.stringify(db.exec('SELECT last_insert_rowid(), changes()')));

  // STEP 3: save (like saveDatabase)
  const buf = Buffer.from(db.export());
  // Don't actually write to disk for speed
  // fs.writeFileSync(...)

  // STEP 4: insert via runStmt equivalent
  db.run('INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)', ['NewLab', 'NewAddr', 14.0, 79.0]);
  const idResult = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
  console.log('After new insert (runStmt equivalent):', JSON.stringify(idResult));

  // Direct check
  const all = db.exec('SELECT * FROM pathologies ORDER BY id');
  console.log('All labs:', JSON.stringify(all));

  db.close();
}

test().catch(console.error);
