const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
  db.run("INSERT INTO t (name) VALUES (?)", ["hello"]);
  console.log("After db.run:", JSON.stringify(db.exec("SELECT last_insert_rowid()")));

  db.exec("INSERT INTO t (name) VALUES ('world')");
  console.log("After db.exec:", JSON.stringify(db.exec("SELECT last_insert_rowid()")));

  const r = db.exec("INSERT INTO t (name) VALUES ('foo'); SELECT last_insert_rowid()");
  console.log("Combined:", JSON.stringify(r));

  console.log("All rows:", JSON.stringify(db.exec("SELECT * FROM t")));
}
test().catch(console.error);
