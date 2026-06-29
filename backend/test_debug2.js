const { getDatabase, runStmt, queryAll, queryOne, closeDatabase, saveDatabase } = require('./database');

async function test() {
  await getDatabase();

  // Try direct db.access
  const initSqlJs = require('sql.js');
  const fs = require('fs');
  const path = require('path');

  // We need the raw db object. Let's monkey-patch to test.
  // First test: use db.run + exec directly through the db module
  // by calling runStmt

  const result1 = runStmt(
    "INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    ["Test A", "Addr A", 12.1, 77.1]
  );
  console.log('runStmt result:', JSON.stringify(result1));

  // Let's try a direct approach with a new db
  // It's possible the issue is module caching or similar
  const SQL = await initSqlJs();
  const testDb = new SQL.Database();

  testDb.run("CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
  testDb.run("INSERT INTO test_table (name) VALUES (?)", ["direct"]);
  const r1 = testDb.exec("SELECT last_insert_rowid() as id, changes() as changes");
  console.log('Fresh DB test:', JSON.stringify(r1));

  // Now test with the same SQL as runStmt
  testDb.run("INSERT INTO test_table (name) VALUES (?)", ["direct2"]);
  const r2 = testDb.exec("SELECT last_insert_rowid() as id, changes() as changes");
  console.log('Fresh DB test 2:', JSON.stringify(r2));

  testDb.close();

  closeDatabase();
}

test().catch(console.error);
