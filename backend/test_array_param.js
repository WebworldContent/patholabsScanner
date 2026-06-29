const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, count INTEGER)');

  // Insert with an array where count should be a number
  const data = ['test', ['a', 'b']];
  try {
    db.run('INSERT INTO t (name, count) VALUES (?, ?)', data);
    console.log('After array param insert:', JSON.stringify(db.exec('SELECT * FROM t')));
    console.log('last_insert_rowid:', JSON.stringify(db.exec('SELECT last_insert_rowid()')));
    console.log('changes:', JSON.stringify(db.exec('SELECT changes()')));
  } catch(e) {
    console.log('ERROR:', e.message);
  }

  // Insert with normal params
  db.run('INSERT INTO t (name, count) VALUES (?, ?)', ['normal', 42]);
  console.log('After normal insert:', JSON.stringify(db.exec('SELECT * FROM t')));
  console.log('last_insert_rowid:', JSON.stringify(db.exec('SELECT last_insert_rowid()')));
  console.log('changes:', JSON.stringify(db.exec('SELECT changes()')));

  db.close();
}
test().catch(console.error);
