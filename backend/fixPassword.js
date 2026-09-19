const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function fix() {
  const dbFile = path.join(__dirname, 'database', 'database.sqlite');
  try {
    const db = await open({
      filename: dbFile,
      driver: sqlite3.Database
    });
    const hash = '$2a$10$B8MrWsCFHVOgD6jmykjmcOUW5jsEjxjOMbRHuJD/a4VrSwxmhnry6'; // password123
    await db.run('UPDATE users SET password_hash = ?', [hash]);
    await db.run('UPDATE admins SET password_hash = ?', [hash]);
    console.log('✅ Passwords updated successfully to password123');
    await db.close();
  } catch (err) {
    console.error('❌ Error updating passwords:', err.message);
  }
}

fix();
