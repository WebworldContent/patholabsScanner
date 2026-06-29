const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');

  // Test 1: db.run with params
  db.run('INSERT INTO t (name) VALUES (?)', ['hello']);
  console.log('Test 1 (run with params):', JSON.stringify(db.exec('SELECT last_insert_rowid(), changes()')));

  // Test 2: db.run without params
  db.run("INSERT INTO t (name) VALUES ('world')");
  console.log('Test 2 (run without params):', JSON.stringify(db.exec('SELECT last_insert_rowid(), changes()')));

  // Test 3: db.exec without params
  db.exec("INSERT INTO t (name) VALUES ('foo')");
  console.log('Test 3 (exec without params):', JSON.stringify(db.exec('SELECT last_insert_rowid(), changes()')));

  // Test 4: db.exec with combined
  const r = db.exec("INSERT INTO t (name) VALUES ('bar'); SELECT last_insert_rowid() as id, changes() as changes");
  console.log('Test 4 (combined exec):', JSON.stringify(r));

  console.log('All rows:', JSON.stringify(db.exec('SELECT * FROM t')));
}
test().catch(console.error);
