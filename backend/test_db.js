const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'test_debug.db');
try { fs.unlinkSync(dbPath); } catch(e) {}

const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run("CREATE TABLE pathologies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, address TEXT, latitude REAL, longitude REAL)");
  db.run("INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    ["Test", "Addr", 12.97, 77.64]);

  const ret = db.exec("SELECT last_insert_rowid() as id");
  console.log("Result #1:", JSON.stringify(ret));
  console.log("Rowid #1:", ret[0].values[0][0]);

  db.run("INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    ["Test2", "Addr2", 13.0, 77.5]);

  const ret2 = db.exec("SELECT last_insert_rowid() as id, changes() as changes");
  console.log("Result #2:", JSON.stringify(ret2));
  console.log("Rowid #2:", ret2[0].values[0][0]);

  db.run("UPDATE pathologies SET name=? WHERE id=?", ["Updated", 1]);
  const ret3 = db.exec("SELECT changes() as changes");
  console.log("Changes:", JSON.stringify(ret3));
  console.log("Rows changed:", ret3[0].values[0][0]);

  const all = db.exec("SELECT * FROM pathologies");
  console.log("All rows:", JSON.stringify(all));

  db.close();
}

test().catch(console.error);
