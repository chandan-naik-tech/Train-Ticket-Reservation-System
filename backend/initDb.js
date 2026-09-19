const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function init() {
  console.log('⏳ Initializing SQLite Database...');
  const dbFile = path.join(__dirname, 'database', 'database.sqlite');
  
  // If exists, you might want to wipe it for a fresh start, but we will just ensure it exists
  if (fs.existsSync(dbFile)) {
    console.log('ℹ️ Database file already exists. Dropping existing tables and rebuilding schema.');
    fs.unlinkSync(dbFile);
  }

  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  const schemaPath = path.join(__dirname, 'database', 'schema.sqlite.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // SQLite exec can run multiple statements separated by semicolons
  try {
    await db.exec(schemaSql);
    console.log('✅ SQLite Database successfully initialized and seeded with mock users.');
  } catch (err) {
    console.error('❌ Error executing schema:', err.message);
  }

  await db.close();
}

init();
