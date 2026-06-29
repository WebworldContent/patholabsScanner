const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'pathology.db');

  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run('CREATE TABLE IF NOT EXISTS pathologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, phone TEXT, email TEXT, website TEXT, rating REAL DEFAULT 0, total_reviews INTEGER DEFAULT 0, opening_hours TEXT, about TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  }

  // Check current state
  console.log('Existing rows:', JSON.stringify(db.exec('SELECT id, name FROM pathologies ORDER BY id')));

  // Now do runStmt equivalent
  db.run("INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    ["InlineTest", "InlineAddr", 12.5, 77.5]);
  const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
  console.log('runStmt equivalent:', JSON.stringify(result));

  // Check all rows now
  console.log('After insert:', JSON.stringify(db.exec('SELECT id, name FROM pathologies ORDER BY id')));

  db.close();
}
test().catch(console.error);
