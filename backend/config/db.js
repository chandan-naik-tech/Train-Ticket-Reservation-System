const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise;

async function initDB() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '..', 'database', 'database.sqlite'),
      driver: sqlite3.Database
    }).then(async (db) => {
      await db.exec('PRAGMA foreign_keys = ON');
      console.log('✅ Connected to SQLite database');
      return db;
    }).catch(err => {
      console.error('❌ Error connecting to SQLite:', err.message);
    });
  }
  return dbPromise;
}

// Ensure connection starts
initDB();

module.exports = {
  // Mock the mysql2 pool.query API which returns [rows, fields]
  query: async (sql, params = []) => {
    const db = await initDB();
    const cleanSql = sql.trim().toUpperCase();
    try {
      if (cleanSql.startsWith('SELECT') || cleanSql.startsWith('SHOW')) {
        const rows = await db.all(sql, params);
        return [rows, null];
      } else {
        const result = await db.run(sql, params);
        // mysql2 returns { affectedRows, insertId }
        return [{ affectedRows: result.changes, insertId: result.lastID }, null];
      }
    } catch (error) {
      console.error(`Database Query Error on SQL: ${sql}`, error);
      throw error;
    }
  },
  
  // Provide raw DB access for transactions
  getDb: async () => {
    return await initDB();
  }
};
