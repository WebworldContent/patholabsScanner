const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'test_save.db');
try { fs.unlinkSync(dbPath); } catch(e) {}

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run("CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
  db.run("INSERT INTO t (name) VALUES (?)", ["first"]);
  console.log("After 1st insert:", JSON.stringify(db.exec("SELECT last_insert_rowid()")));

  // save
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  db.run("INSERT INTO t (name) VALUES (?)", ["second"]);
  console.log("After 2nd insert (after save):", JSON.stringify(db.exec("SELECT last_insert_rowid()")));

  // save again
  const data2 = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data2));

  console.log("All rows:", JSON.stringify(db.exec("SELECT * FROM t")));
  db.close();
}

test().catch(console.error);
