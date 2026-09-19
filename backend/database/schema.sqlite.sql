-- RailVerse AI - SQLite Database Schema and Seed Data

PRAGMA foreign_keys = ON;

-- 1. Table users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  aadhaar VARCHAR(12) NOT NULL,
  wallet_balance REAL DEFAULT 10000.00,
  role VARCHAR(20) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table admins
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table stations
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_code ON stations(code);

-- 4. Table trains
CREATE TABLE IF NOT EXISTS trains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  source_station_id INTEGER NOT NULL,
  destination_station_id INTEGER NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL,
  runs_on VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  FOREIGN KEY (source_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_train_number ON trains(number);

-- 5. Table routes
CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  train_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  stop_number INTEGER NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  distance INTEGER NOT NULL,
  fare_factor REAL DEFAULT 1.00,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- 6. Table coaches
CREATE TABLE IF NOT EXISTS coaches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  train_id INTEGER NOT NULL,
  coach_number VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
);

-- 7. Table seats
CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_type VARCHAR(20) NOT NULL,
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- 8. Table bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pnr VARCHAR(10) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  train_id INTEGER NOT NULL,
  source_station_id INTEGER NOT NULL,
  destination_station_id INTEGER NOT NULL,
  journey_date DATE NOT NULL,
  quota VARCHAR(30) DEFAULT 'General',
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_fare REAL NOT NULL,
  status VARCHAR(20) DEFAULT 'Booked',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  FOREIGN KEY (source_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_booking_pnr ON bookings(pnr);

-- 9. Table passengers
CREATE TABLE IF NOT EXISTS passengers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(10) NOT NULL,
  aadhaar VARCHAR(12) NOT NULL,
  coach_number VARCHAR(10) NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_type VARCHAR(20) NOT NULL,
  status VARCHAR(10) DEFAULT 'CNF',
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 10. Table payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Table tickets
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  qr_code_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- 12. Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Table feedback
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Table travel_history
CREATE TABLE IF NOT EXISTS travel_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  train_id INTEGER NOT NULL,
  journey_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
);

-- Seed Data: Stations (Trimmed subset to keep this file concise for init. We will load stations programmatically or from an array if needed, but here's a few key stations for the mock trains)
INSERT INTO stations (code, name, city, state) VALUES
('CSTM', 'CHHATRAPATI Shivaji Terminus', 'Mumbai', 'Maharashtra'),
('NDLS', 'New Delhi', 'Delhi', 'Delhi'),
('MMCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
('HWH', 'Howrah Jn.', 'Kolkata', 'West Bengal'),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
('SBC', 'KSR Bengaluru', 'Bangalore', 'Karnataka'),
('PNBE', 'Patna Jn.', 'Patna', 'Bihar'),
('LKO', 'Lucknow Charbagh', 'Lucknow', 'Uttar Pradesh'),
('GKP', 'Gorakhpur Jn.', 'Gorakhpur', 'Uttar Pradesh'),
('ADI', 'Ahmedabad Jn.', 'Ahmedabad', 'Gujarat');


-- Seed Data: Users
INSERT INTO users (username, email, password_hash, full_name, phone, aadhaar, wallet_balance, role) VALUES
('testuser', 'user@railverse.com', '$2a$10$B8MrWsCFHVOgD6jmykjmcOUW5jsEjxjOMbRHuJD/a4VrSwxmhnry6', 'Rajesh Kumar', '9876543210', '123456789012', 15000.00, 'user');

INSERT INTO admins (username, email, password_hash, role) VALUES
('admin', 'admin@railverse.com', '$2a$10$B8MrWsCFHVOgD6jmykjmcOUW5jsEjxjOMbRHuJD/a4VrSwxmhnry6', 'admin');
