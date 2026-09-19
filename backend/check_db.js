const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function check() {
  const dbFile = path.join(__dirname, 'database', 'database.sqlite');
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  const routes = await db.all(`
    SELECT r.*, s.name, s.code 
    FROM routes r 
    JOIN stations s ON r.station_id = s.id 
    ORDER BY r.train_id, r.stop_number
  `);
  
  const srcId = await db.get(`SELECT id FROM stations WHERE name LIKE '%Udupi%' OR code = 'UDUP'`);
  const destId = await db.get(`SELECT id FROM stations WHERE name LIKE '%Mumbai%' OR code = 'CSMT'`);

  console.log('Source Station ID for Udupi:', srcId);
  console.log('Dest Station ID for Mumbai:', destId);

  if (srcId && destId) {
    const matchingTrains = await db.all(`
      SELECT t.id, t.name, t.number
      FROM routes rs
      JOIN routes rd ON rs.train_id = rd.train_id
      JOIN trains t ON t.id = rs.train_id
      WHERE rs.station_id = ? AND rd.station_id = ? AND rs.stop_number < rd.stop_number
    `, [srcId.id, destId.id]);
    
    console.log('Trains found for Udupi -> CSMT:', matchingTrains);
  }

  // Print all routes for trains containing Udupi
  if (srcId) {
    const udupiRoutes = await db.all(`SELECT train_id FROM routes WHERE station_id = ?`, [srcId.id]);
    console.log(`Trains passing through Udupi:`, udupiRoutes.map(r => r.train_id));
    
    for (const r of udupiRoutes) {
      const trainRoutes = await db.all(`
        SELECT r.stop_number, s.name, s.code 
        FROM routes r JOIN stations s ON r.station_id = s.id 
        WHERE r.train_id = ? ORDER BY r.stop_number
      `, [r.train_id]);
      console.log(`Route for train ${r.train_id}:`, trainRoutes);
    }
  }
}

check();
