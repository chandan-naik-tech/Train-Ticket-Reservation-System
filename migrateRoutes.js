const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
  const dbFile = path.join(__dirname, 'backend', 'database', 'database.sqlite');
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  const trains = await db.all('SELECT * FROM trains');
  console.log(`Found ${trains.length} trains.`);

  for (const t of trains) {
    const existing = await db.get('SELECT * FROM routes WHERE train_id = ?', [t.id]);
    if (!existing) {
      console.log(`Migrating Train ID ${t.id}...`);
      await db.run(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.source_station_id, 1, null, t.departure_time, 0]
      );
      await db.run(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.destination_station_id, 2, t.arrival_time, null, parseInt(t.duration) * 70 || 500]
      );
    }
  }

  console.log('Migration Complete.');
}

migrate();
