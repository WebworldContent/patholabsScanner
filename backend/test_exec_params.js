const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE t (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, val INTEGER)');
  db.run('INSERT INTO t (name, val) VALUES (?, ?)', ['hello', 42]);
  db.run('INSERT INTO t (name, val) VALUES (?, ?)', ['world', 99]);

  // Does exec support params? Let's test.
  try {
    const r1 = db.exec('SELECT * FROM t WHERE id = ?', [1]);
    console.log('exec with params:', JSON.stringify(r1));
  } catch(e) {
    console.log('exec with params ERROR:', e.message);
  }

  // Without params
  try {
    const r2 = db.exec('SELECT * FROM t WHERE id = 1');
    console.log('exec without params:', JSON.stringify(r2));
  } catch(e) {
    console.log('exec without params ERROR:', e.message);
  }
}
test().catch(console.error);
