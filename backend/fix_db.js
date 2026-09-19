const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function fixDB() {
  const dbFile = path.join(__dirname, 'database', 'database.sqlite');
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  const trains = await db.all('SELECT * FROM trains');
  let fixedCount = 0;

  for (const t of trains) {
    const routes = await db.all('SELECT * FROM routes WHERE train_id = ? ORDER BY stop_number', [t.id]);
    
    let hasSource = false;
    let hasDest = false;

    for (const r of routes) {
      if (r.station_id === t.source_station_id) hasSource = true;
      if (r.station_id === t.destination_station_id) hasDest = true;
    }

    if (!hasSource || !hasDest) {
      console.log(`Fixing train ${t.id} (${t.name})`);
      await db.run('DELETE FROM routes WHERE train_id = ?', [t.id]);
      
      // 1. Insert Source
      await db.run(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.source_station_id, 1, null, t.departure_time, 0]
      );

      // 2. Insert existing intermediate stops (shifted by +1)
      let currentStop = 2;
      for (const r of routes) {
        if (r.station_id !== t.source_station_id && r.station_id !== t.destination_station_id) {
          await db.run(
            `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
            [t.id, r.station_id, currentStop, r.arrival_time, r.departure_time, r.distance]
          );
          currentStop++;
        }
      }

      // 3. Insert Destination
      await db.run(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.destination_station_id, currentStop, t.arrival_time, null, parseInt(t.duration) * 70 || 500]
      );
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} corrupted trains!`);
}

fixDB();
