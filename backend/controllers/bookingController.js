const db = require('../config/db');

// Helper to generate 10-digit numeric PNR
const generatePNR = () => {
  let pnr = '';
  for (let i = 0; i < 10; i++) {
    pnr += Math.floor(Math.random() * 10);
  }
  return pnr;
};

// Book ticket
exports.bookTicket = async (req, res) => {
  const { trainId, sourceId, destId, journeyDate, quota, totalFare, classType, passengers } = req.body;
  const userId = req.user.id;

  if (!trainId || !sourceId || !destId || !journeyDate || !passengers || passengers.length === 0) {
    return res.status(400).json({ message: 'Missing booking details.' });
  }

  const pnr = generatePNR();

  try {
    const dbInstance = await db.getDb();
    
    await dbInstance.run('BEGIN TRANSACTION');

    // 1. Emulate BookTicketSP
    const userRow = await dbInstance.get('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    const user_balance = userRow ? userRow.wallet_balance : 0;
    
    if (user_balance < totalFare) {
      await dbInstance.run('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct money
    await dbInstance.run('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [totalFare, userId]);

    // Insert Booking
    const bookingRes = await dbInstance.run(
      `INSERT INTO bookings (pnr, user_id, train_id, source_station_id, destination_station_id, journey_date, quota, total_fare, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Booked')`,
      [pnr, userId, trainId, sourceId, destId, journeyDate, quota || 'General', totalFare]
    );
    const bookingId = bookingRes.lastID;

    // Log into travel history
    await dbInstance.run(
      `INSERT INTO travel_history (user_id, train_id, journey_date, status) VALUES (?, ?, ?, 'Upcoming')`,
      [userId, trainId, journeyDate]
    );

    // Log Payment
    await dbInstance.run(
      `INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, 'Wallet', ?, 'Success')`,
      [bookingId, userId, totalFare, `TXN-WL-${pnr}`]
    );

    // Trigger Notification
    await dbInstance.run(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Booking Confirmed', ?)`,
      [userId, `Your ticket for PNR ${pnr} has been booked. Check your dashboard for details.`]
    );

    // 2. Allocate coach and seat numbers for passengers
    const coaches = await dbInstance.all('SELECT * FROM coaches WHERE train_id = ? AND type = ?', [trainId, classType || '3A']);
    
    let coachNum = 'B1';
    if (coaches && coaches.length > 0) {
      coachNum = coaches[0].coach_number;
    } else {
      coachNum = classType === 'SL' ? 'S1' : classType === '1A' ? 'H1' : classType === '2A' ? 'A1' : 'C1';
    }

    const seatTypes = ['Lower', 'Middle', 'Upper', 'Window', 'Side-Lower', 'Side-Upper'];

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const seatNum = Math.floor(Math.random() * 15) + 1;
      const sType = seatTypes[seatNum % 6];
      await dbInstance.run(
        `INSERT INTO passengers (booking_id, name, age, gender, aadhaar, coach_number, seat_number, seat_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CNF')`,
        [bookingId, p.name, p.age, p.gender, p.aadhaar, coachNum, seatNum, sType]
      );
    }

    // 3. Create Ticket Entry
    const qrCodeData = JSON.stringify({
      pnr,
      journeyDate,
      trainId,
      passengerCount: passengers.length,
      status: 'CNF'
    });

    await dbInstance.run(
      'INSERT INTO tickets (booking_id, qr_code_data) VALUES (?, ?)',
      [bookingId, qrCodeData]
    );

    await dbInstance.run('COMMIT');

    res.status(201).json({
      message: 'Ticket booked successfully!',
      pnr,
      bookingId,
      totalFare
    });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Database error booking ticket.' });
  }
};

// Get booking details by PNR
exports.getBookingByPNR = async (req, res) => {
  const { pnr } = req.params;

  try {
    const [bookings] = await db.query(
      `SELECT b.*, t.name AS train_name, t.number AS train_number, t.type AS train_type,
              s1.name AS source_name, s1.code AS source_code, s1.city AS source_city,
              s2.name AS dest_name, s2.code AS dest_code, s2.city AS dest_city,
              tk.qr_code_data
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.source_station_id = s1.id
       JOIN stations s2 ON b.destination_station_id = s2.id
       LEFT JOIN tickets tk ON tk.booking_id = b.id
       WHERE b.pnr = ?`,
      [pnr]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'PNR not found.' });
    }

    const booking = bookings[0];
    const [passengers] = await db.query('SELECT * FROM passengers WHERE booking_id = ?', [booking.id]);

    res.json({
      ...booking,
      passengers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving PNR.' });
  }
};

// Cancel Ticket
exports.cancelTicket = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
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
    await dbInstance.run('UPDATE bookings SET status = "Cancelled" WHERE id = ?', [bookingId]);
    await dbInstance.run('UPDATE passengers SET status = "CAN" WHERE booking_id = ?', [bookingId]);
    
    // Notification for cancellation
    await dbInstance.run(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Ticket Cancelled Successfully', ?)`,
      [booking.user_id, `Your booking for Train PNR ${booking.pnr} has been successfully cancelled. Refund has been initiated to your RailVerse Wallet.`]
    );

    await dbInstance.run(
      `UPDATE travel_history SET status = 'Cancelled' WHERE user_id = ? AND journey_date = ?`,
      [booking.user_id, booking.journey_date]
    );

    await dbInstance.run(
      'INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, "Refund", ?, "Success")',
      [bookingId, booking.user_id, booking.total_fare, `REFUND-${booking.pnr}`]
    );

    await dbInstance.run('COMMIT');

    res.json({ message: 'Ticket cancelled successfully and full refund credited to wallet.' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Server error during cancellation.' });
  }
};

// Get User Booking History
exports.getHistory = async (req, res) => {
  try {
    const [history] = await db.query(
      `SELECT b.*, t.name AS train_name, t.number AS train_number, t.type AS train_type,
              s1.name AS source_name, s1.code AS source_code,
              s2.name AS dest_name, s2.code AS dest_code
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON b.source_station_id = s1.id
       JOIN stations s2 ON b.destination_station_id = s2.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    const bookingsWithPassengers = await Promise.all(
      history.map(async (booking) => {
        const [passengers] = await db.query('SELECT * FROM passengers WHERE booking_id = ?', [booking.id]);
        return {
          ...booking,
          passengers
        };
      })
    );

    res.json(bookingsWithPassengers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading booking history.' });
  }
};

// Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(notifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error loading notifications.' });
  }
};

// Submit Feedback
exports.submitFeedback = async (req, res) => {
  const { rating, comments } = req.body;
  
  if (!rating) {
    return res.status(400).json({ message: 'Rating is required.' });
  }

  try {
    const dbInstance = await db.getDb();
    await dbInstance.run('BEGIN TRANSACTION');
    
    await dbInstance.run('INSERT INTO feedback (user_id, rating, comments) VALUES (?, ?, ?)', [req.user.id, rating, comments]);
    await dbInstance.run(
      `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Thank you for your feedback!', 'We appreciate you taking the time to write a review. Travel safe with RailVerse AI!')`,
      [req.user.id]
    );
    
    await dbInstance.run('COMMIT');

    res.json({ message: 'Thank you for your feedback!' });
  } catch (error) {
    console.error(error);
    const dbInstance = await db.getDb();
    await dbInstance.run('ROLLBACK');
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
};
