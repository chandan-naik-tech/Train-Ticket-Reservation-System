const db = require('../config/db');

// Get Admin Analytics Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core KPIs
    const [[{ total_bookings }]] = await db.query('SELECT COUNT(*) AS total_bookings FROM bookings');
    const [[{ total_revenue }]] = await db.query('SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = "Success" AND payment_method != "Refund"');
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users WHERE role = "user"');
    const [[{ total_trains }]] = await db.query('SELECT COUNT(*) AS total_trains FROM trains');

    // 2. Revenue by Train Type
    const [revenueByType] = await db.query(
      `SELECT t.type, COALESCE(SUM(b.total_fare), 0) as revenue
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       WHERE b.status = "Booked"
       GROUP BY t.type`
    );

    // 3. User bookings trends (Recent 7 days)
    const [bookingsTrend] = await db.query(
      `SELECT DATE(booking_date) AS date, COUNT(*) AS count
       FROM bookings
       WHERE DATE(booking_date) >= date('now', '-7 days')
       GROUP BY DATE(booking_date)
       ORDER BY DATE(booking_date) ASC`
    );

    // 4. Popular routes
    const [popularRoutes] = await db.query(
      `SELECT t.number, t.name, COUNT(b.id) AS bookings_count
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       GROUP BY t.id
       ORDER BY bookings_count DESC
       LIMIT 5`
    );

    res.json({
      kpis: {
        totalBookings: total_bookings,
        totalRevenue: parseFloat(total_revenue),
        totalUsers: total_users,
        totalTrains: total_trains
      },
      revenueByType,
      bookingsTrend,
      popularRoutes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading admin dashboard stats.' });
  }
};

// Manage Users (List all)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, full_name, phone, aadhaar, wallet_balance, created_at FROM users WHERE role = "user"');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users.' });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, aadhaar, wallet_balance } = req.body;

  try {
    await db.query(
      `UPDATE users 
       SET full_name = ?, email = ?, phone = ?, aadhaar = ?, wallet_balance = ? 
       WHERE id = ? AND role = "user"`,
      [full_name, email, phone, aadhaar, wallet_balance, id]
    );
    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user.' });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    
    // The DB will restrict or cascade. Assuming we manually delete related for safety
    await dbInstance.run('DELETE FROM passengers WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = ?)', [id]);
    await dbInstance.run('DELETE FROM payments WHERE user_id = ?', [id]);
    await dbInstance.run('DELETE FROM tickets WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = ?)', [id]);
    await dbInstance.run('DELETE FROM travel_history WHERE user_id = ?', [id]);
    await dbInstance.run('DELETE FROM notifications WHERE user_id = ?', [id]);
    await dbInstance.run('DELETE FROM feedback WHERE user_id = ?', [id]);
    await dbInstance.run('DELETE FROM bookings WHERE user_id = ?', [id]);
    await dbInstance.run('DELETE FROM users WHERE id = ?', [id]);
    
    await dbInstance.run('COMMIT');
    res.json({ message: 'User and all related records deleted successfully.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Error deleting user.' });
  }
};

// Manage Bookings (List all)
exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.full_name AS user_name, t.name AS train_name, t.number AS train_number,
              s1.code AS source_code, s2.code AS dest_code
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.source_station_id = s1.id
       JOIN stations s2 ON b.destination_station_id = s2.id
       ORDER BY b.booking_date DESC`
    );
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bookings.' });
  }
};

// Admin Cancel Booking
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookings[0];

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');

    // Refund
    await dbInstance.run('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [booking.total_fare, booking.user_id]);

    // Update status
    await dbInstance.run('UPDATE bookings SET status = "Cancelled" WHERE id = ?', [id]);
    await dbInstance.run('UPDATE passengers SET status = "CAN" WHERE booking_id = ?', [id]);
    
    // Notification for cancellation
    await dbInstance.run(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Booking Cancelled by Admin', ?)`,
      [booking.user_id, `Your booking for Train PNR ${booking.pnr} has been cancelled by an Administrator. A full refund of ₹${booking.total_fare} has been credited to your RailVerse Wallet.`]
    );

    await dbInstance.run(
      `UPDATE travel_history SET status = 'Cancelled' WHERE user_id = ? AND journey_date = ?`,
      [booking.user_id, booking.journey_date]
    );

    await dbInstance.run(
      'INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, "Refund", ?, "Success")',
      [id, booking.user_id, booking.total_fare, `REFUND-ADM-${booking.pnr}`]
    );

    await dbInstance.run('COMMIT');

    res.json({ message: 'Booking cancelled successfully. Refund processed.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Server error during cancellation.' });
  }
};

// Delete Booking
exports.deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    
    await dbInstance.run('DELETE FROM passengers WHERE booking_id = ?', [id]);
    await dbInstance.run('DELETE FROM payments WHERE booking_id = ?', [id]);
    await dbInstance.run('DELETE FROM tickets WHERE booking_id = ?', [id]);
    await dbInstance.run('DELETE FROM bookings WHERE id = ?', [id]);
    
    await dbInstance.run('COMMIT');
    res.json({ message: 'Booking deleted successfully.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Error deleting booking.' });
  }
};

// Helper to resolve or create station
const resolveStation = async (text) => {
  if (!text) return null;
  const cleanText = text.trim();
  const match = cleanText.match(/(.+?)\s*\(([^)]+)\)/);
  let stName = cleanText;
  let stCode = cleanText.substring(0, 4).toUpperCase().trim();
  
  if (match) {
    stName = match[1].trim();
    stCode = match[2].trim();
  }

  // Try to find by code, exact name, or partial name
  const [existing] = await db.query('SELECT id FROM stations WHERE code = ? OR name = ? OR name LIKE ? OR CONCAT(name, " (", code, ")") = ? LIMIT 1', [stCode, stName, `${stName}%`, cleanText]);
  
  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new station if not found
  const [result] = await db.query('INSERT INTO stations (name, code, city, state) VALUES (?, ?, ?, ?)', [stName, stCode, stName, 'Unknown']);
  return result.insertId;
};

// Get All Trains (For Admin Dashboard)
exports.getAllTrains = async (req, res) => {
  try {
    const [trains] = await db.query(
      `SELECT t.*, 
              s1.name AS source_name, s1.code AS source_code,
              s2.name AS dest_name, s2.code AS dest_code
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       ORDER BY t.id DESC`
    );
    res.json(trains);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching all trains.' });
  }
};

// Create Train
exports.createTrain = async (req, res) => {
  const { number, name, type, sourceText, destText, departure_time, arrival_time, duration, runs_on, stops } = req.body;

  if (!number || !name || !type || !sourceText || !destText || !departure_time || !arrival_time || !duration) {
    return res.status(400).json({ message: 'Missing train details.' });
  }

  try {
    const srcId = await resolveStation(sourceText);
    const destId = await resolveStation(destText);

    const [result] = await db.query(
      `INSERT INTO trains (number, name, type, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [number, name, type, srcId, destId, departure_time, arrival_time, duration, runs_on || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun']
    );

    const trainId = result.insertId;

    // Auto add default coaches
    await db.query('INSERT INTO coaches (train_id, coach_number, type) VALUES (?, "C1", "CC"), (?, "E1", "EC"), (?, "A1", "2A"), (?, "B1", "3A")', [trainId, trainId, trainId, trainId]);

    // Handle Routes (Intermediate Stops)
    if (stops && Array.isArray(stops) && stops.length > 0) {
      // 1. Insert Source
      await db.query(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [trainId, srcId, 1, null, departure_time, 0]
      );
      // 2. Insert Intermediate Stops
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const stopStationId = await resolveStation(stop.station);
        await db.query(
          `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
          [trainId, stopStationId, i + 2, stop.arrival || null, stop.departure || null, stop.distance || 0]
        );
      }
      // 3. Insert Destination
      await db.query(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [trainId, destId, stops.length + 2, arrival_time, null, parseInt(duration) * 70 || 500]
      );
    } else {
      // Fallback: Create just 2 route stops (source and destination)
      await db.query(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [trainId, srcId, 1, null, departure_time, 0]
      );
      await db.query(
        `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
        [trainId, destId, 2, arrival_time, null, parseInt(duration) * 70 || 500] // Rough distance estimate
      );
    }

    res.status(201).json({ message: 'Train added successfully. Default coaches assigned.', trainId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Train number already exists.' });
    }
    res.status(500).json({ message: 'Error creating train.' });
  }
};

// Update Train
exports.updateTrain = async (req, res) => {
  const { id } = req.params;
  const { name, type, sourceText, destText, departure_time, arrival_time, duration, runs_on, stops } = req.body;

  try {
    const srcId = await resolveStation(sourceText);
    const destId = await resolveStation(destText);

    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');

    await dbInstance.run(
      `UPDATE trains 
       SET name = ?, type = ?, source_station_id = ?, destination_station_id = ?, departure_time = ?, arrival_time = ?, duration = ?, runs_on = ?
       WHERE id = ?`,
      [name, type, srcId, destId, departure_time, arrival_time, duration, runs_on, id]
    );

    // Rebuild routes
    await dbInstance.run(`DELETE FROM routes WHERE train_id = ?`, [id]);
    
    // 1. Insert Source
    await dbInstance.run(
      `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, srcId, 1, null, departure_time, 0]
    );
    
    // 2. Insert Intermediates (if any)
    if (stops && Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const stopStationId = await resolveStation(stop.station);
        await dbInstance.run(
          `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, stopStationId, i + 2, stop.arrival || null, stop.departure || null, stop.distance || 0]
        );
      }
    }
    
    // 3. Insert Destination
    const destStopNumber = (stops && Array.isArray(stops) ? stops.length : 0) + 2;
    await dbInstance.run(
      `INSERT INTO routes (train_id, station_id, stop_number, arrival_time, departure_time, distance) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, destId, destStopNumber, arrival_time, null, parseInt(duration) * 70 || 500]
    );

    await dbInstance.run('COMMIT');
    res.json({ message: 'Train updated successfully.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Error updating train.' });
  }
};

// Delete Train
exports.deleteTrain = async (req, res) => {
  const { id } = req.params;

  try {
    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    await dbInstance.run('DELETE FROM routes WHERE train_id = ?', [id]);
    await dbInstance.run('DELETE FROM coaches WHERE train_id = ?', [id]);
    // Also delete any seats related to these coaches if they existed (in our schema seats might not be tied directly, but let's be safe if they exist)
    await dbInstance.run('DELETE FROM trains WHERE id = ?', [id]);
    await dbInstance.run('COMMIT');
    res.json({ message: 'Train deleted successfully.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Error deleting train.' });
  }
};
