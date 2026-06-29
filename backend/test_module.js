const { getDatabase, runStmt, queryAll, closeDatabase } = require('./database');

async function test() {
  await getDatabase();
  const result = runStmt(
    "INSERT INTO pathologies (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
    ["Direct Test", "Addr", 12.0, 77.0]
  );
  console.log("runStmt result:", JSON.stringify(result));
  const labs = queryAll("SELECT * FROM pathologies ORDER BY id DESC LIMIT 3");
  console.log("Last labs:", JSON.stringify(labs));
  closeDatabase();
}

test().catch(console.error);
