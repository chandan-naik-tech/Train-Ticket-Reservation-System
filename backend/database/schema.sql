-- ==========================================
-- RailVerse AI - Database Schema and Seed Data
-- ==========================================

CREATE DATABASE IF NOT EXISTS railverse_db;
USE railverse_db;

-- -----------------------------------------------------
-- Table DROPS (for clean reinstall)
-- -----------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS travel_history;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS coaches;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS trains;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 1. Table users
-- -----------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  aadhaar VARCHAR(12) NOT NULL,
  wallet_balance DECIMAL(10,2) DEFAULT 10000.00,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 2. Table admins
-- -----------------------------------------------------
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 3. Table stations
-- -----------------------------------------------------
CREATE TABLE stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  INDEX idx_station_code (code)
);

-- -----------------------------------------------------
-- 4. Table trains
-- -----------------------------------------------------
CREATE TABLE trains (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. Vande Bharat, Rajdhani, Shatabdi, Tejas, Duronto, Mail, Express
  source_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL, -- e.g. "04h 30m"
  runs_on VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', -- comma separated days
  FOREIGN KEY (source_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  INDEX idx_train_number (number)
);

-- -----------------------------------------------------
-- 5. Table routes
-- -----------------------------------------------------
CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  station_id INT NOT NULL,
  stop_number INT NOT NULL,
  arrival_time TIME,
  departure_time TIME,
  distance INT NOT NULL, -- distance from source in km
  fare_factor DECIMAL(3,2) DEFAULT 1.00,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 6. Table coaches
-- -----------------------------------------------------
CREATE TABLE coaches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  train_id INT NOT NULL,
  coach_number VARCHAR(10) NOT NULL, -- e.g. C1, C2, A1, B1, S1
  type VARCHAR(10) NOT NULL, -- e.g. CC, EC, 1A, 2A, 3A, SL
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 7. Table seats (Static seat layouts)
-- -----------------------------------------------------
CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coach_id INT NOT NULL,
  seat_number INT NOT NULL,
  seat_type VARCHAR(20) NOT NULL, -- e.g. Window, Lower, Middle, Upper, Side-Lower, Side-Upper
  FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 8. Table bookings
-- -----------------------------------------------------
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pnr VARCHAR(10) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  train_id INT NOT NULL,
  source_station_id INT NOT NULL,
  destination_station_id INT NOT NULL,
  journey_date DATE NOT NULL,
  quota VARCHAR(30) DEFAULT 'General', -- General, Tatkal, Ladies, Senior Citizen
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_fare DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Booked', -- Booked, Cancelled
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
  FOREIGN KEY (source_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_station_id) REFERENCES stations(id) ON DELETE CASCADE,
  INDEX idx_booking_pnr (pnr)
);

-- -----------------------------------------------------
-- 9. Table passengers (Dynamic seat allocation details per journey)
-- -----------------------------------------------------
CREATE TABLE passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  aadhaar VARCHAR(12) NOT NULL,
  coach_number VARCHAR(10) NOT NULL,
  seat_number INT NOT NULL,
  seat_type VARCHAR(20) NOT NULL,
  status VARCHAR(10) DEFAULT 'CNF', -- CNF, WL, CAN
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 10. Table payments
-- -----------------------------------------------------
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- UPI, Card, NetBanking
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL, -- Success, Failed
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 11. Table tickets
-- -----------------------------------------------------
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  qr_code_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 12. Table notifications
-- -----------------------------------------------------
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 13. Table feedback
-- -----------------------------------------------------
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 14. Table travel_history
-- -----------------------------------------------------
CREATE TABLE travel_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  train_id INT NOT NULL,
  journey_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- Completed, Cancelled, Upcoming
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- SEED DATA: 100+ stations
-- -----------------------------------------------------
INSERT INTO stations (code, name, city, state) VALUES
('CSTM', 'CHHATRAPATI Shivaji Terminus', 'Mumbai', 'Maharashtra'),
('KYN', 'Kalyan', 'Mumbai', 'Maharashtra'),
('PNVL', 'Panvel', 'Mumbai', 'Maharashtra'),
('NK', 'Nasik road', 'Bhusawal', 'Maharashtra'),
('SUR', 'Solapur', 'Solapur', 'Maharashtra'),
('MMR', 'Manmad', 'Bhusawal', 'Maharashtra'),
('GR', 'Gulbarga', 'Solapur', 'Maharashtra'),
('AK', 'Akola', 'Bhusawal', 'Maharashtra'),
('JL', 'Jalgaon', 'Bhusawal', 'Maharashtra'),
('MRJ', 'Miraj', 'Pune', 'Maharashtra'),
('SNSI', 'Sainagar sirdih', 'Solapur', 'Maharashtra'),
('KOP', 'Kolhapur', 'Pune', 'Maharashtra'),
('BD', 'Badnera', 'Bhusawal', 'Maharashtra'),
('KNW', 'Khandawa', 'Bhusawal', 'Madhya Pradesh'),
('KPG', 'Kopargaon', 'Solapur', 'Maharashtra'),
('DD', 'Daud', 'Solapur', 'Maharashtra'),
('ANG', 'Ahmad nagar', 'Solapur', 'Maharashtra'),
('WR', 'Wardha', 'Nagpur', 'Maharashtra'),
('SEG', 'Shegaon', 'Bhusawal', 'Maharashtra'),
('AMI', 'Amrawati', 'Bhusawal', 'Maharashtra'),
('BPQ', 'BALHARSHAH', 'NAGPUR', 'Maharashtra'),
('LNL', 'Lonavala', 'Mumbai', 'Maharashtra'),
('CD', 'Chandrapur', 'Nagpur', 'Maharashtra'),
('LUR', 'Latur', 'Solapur', 'Maharashtra'),
('BZU', 'Betul', 'Nagpur', 'Madhya Pradesh'),
('BAU', 'Burhanpur', 'Bhusawal', 'Madhya Pradesh'),
('KWV', 'Kurduwadi', 'Solapur', 'Maharashtra'),
('CSN', 'Chalisgaon', 'Bhusawal', 'Maharashtra'),
('MKU', 'Malkapur', 'Bhusawal', 'Maharashtra'),
('SEGM', 'Sewagram', 'Nagpur', 'Maharashtra'),
('BIRD', 'Bhiwandi Road', 'Mumbai', 'Maharashtra'),
('WADI', 'wadi', 'solapur', 'Maharashtra'),
('DI', 'Dombivali', 'Mumbai', 'Maharashtra'),
('BUD', 'Badalapur', 'Mumbai', 'Maharashtra'),
('GC', 'Ghatkopar', 'Mumbai', 'Maharashtra'),
('CLA', 'Kurla', 'Mumbai', 'Maharashtra'),
('ABH', 'Ambarnath', 'Mumbai', 'Maharashtra'),
('MNKD', 'Mankhurd', 'Mumbai', 'Maharashtra'),
('MLND', 'Mulund', 'Mumbai', 'Maharashtra'),
('MBQ', 'Mumbra', 'Mumbai', 'Maharashtra'),
('BEPR', 'Belapur', 'Mumbai', 'Maharashtra'),
('TLA', 'Titwala', 'Mumbai', 'Maharashtra'),
('BND', 'Bhandup', 'Mumbai', 'Maharashtra'),
('NEU', 'Nerul', 'Mumbai', 'Maharashtra'),
('VSH', 'Vashi', 'Mumbai', 'Maharashtra'),
('KHAG', 'Kharghar', 'Mumbai', 'Maharashtra'),
('GV', 'Govandi', 'mumbai', 'Maharashtra'),
('ULNR', 'Ulhasnagar', 'Mumbai', 'Maharashtra'),
('VK', 'Vikhroli', 'Mumbai', 'Maharashtra'),
('KLVA', 'Kalwa', 'Mumbai', 'Maharashtra'),
('BY', 'Byculla', 'Mumbai', 'maharastra'),
('SIN', 'Sion', 'Mumbai', 'maharastra'),
('AIRL', 'Aeroli', 'Mumbai', 'Maharashtra'),
('KJT', 'Karjat', 'mumbai', 'Maharashtra'),
('CMBR', 'Chembur', 'Mumbai', 'Maharashtra'),
('GTBN', 'Guru Teg bahadur nagar', 'Mumbai', 'Maharashtra'),
('GNSL', 'Ghansoli', 'Mumbai', 'Maharashtra'),
('MANR', 'Mansoravar', 'Mumbai', 'Maharashtra'),
('SNCR', 'Sanpada', 'Mumbai', 'Maharashtra'),
('SDAH', 'Sealdah', 'sealdah', 'West Bengal'),
('KOAA', 'Kolkatta terminal', 'sealdah', 'West Bengal'),
('BGP', 'Bhagalpur', 'Maldah', 'Bihar'),
('ASN', 'Asansol', 'ASANSOL', 'West Bengal'),
('BWN', 'Barddhman', 'Howrah', 'West Bengal'),
('NH', 'Naihati', 'Sealdah', 'West Bengal'),
('MLDT', 'Malda Town', 'Maldah', 'West Bengal'),
('JSME', 'Jasidih', 'asansol', 'Jharkhand'),
('DGR', 'Durgapur', 'asansol', 'West Bengal'),
('JMP', 'Jamalpur', 'Maldah', 'Bihar'),
('RPH', 'Rampurhat', 'Howrah', 'West Bengal'),
('BDC', 'Bandel Jn.', 'Howrah', 'West Bengal'),
('NFK', 'New Farakka', 'Maldah', 'West Bengal'),
('MDP', 'Madhupur', 'ASANSOL', 'jharkhand'),
('BHP', 'Bolpur', 'Howrah', 'West Bengal'),
('BPC', 'Berhampur court', 'sealdah', 'West Bengal'),
('SGG', 'Sultanganj', 'maldah', 'Bihar'),
('RNG', 'Raniganj', 'asansol', 'West Bengal'),
('UDL', 'Andal', 'ASANSOL', 'West Bengal'),
('KNJ', 'Krishnanagar city', 'sealdah', 'West Bengal'),
('BP', 'Barackpur', 'sealdah', 'West Bengal'),
('SPR', 'Srirampur', 'howrah', 'West Bengal'),
('DDJ', 'Dum Dum Jn.', 'sealdah', 'West Bengal'),
('SEP', 'Sodepur', 'sealdah', 'West Bengal'),
('BRP', 'Baruipur jn.', 'sealdah', 'West Bengal'),
('SRP', 'Srirampur', 'howrah', 'West Bengal'),
('RIS', 'Rishra', 'howrah', 'West Bengal'),
('KOG', 'Konnagar', 'howrah', 'West Bengal'),
('BT', 'Barasat jn.', 'sealdah', 'West Bengal'),
('BLH', 'Belghoria', 'sealdah', 'West Bengal'),
('SBGR', 'Subhasgram', 'sealdah', 'West Bengal'),
('SNR', 'Shyamngar', 'sealdah', 'West Bengal'),
('BNXR', 'Bidhannagar', 'sealdah', 'West Bengal'),
('HB', 'Habra', 'sealdah', 'West Bengal'),
('MMG', 'Madhyamgram', 'sealdah', 'West Bengal'),
('SHE', 'Sheoraphuli', 'howrah', 'West Bengal'),
('RHA', 'Ranaghat jn.', 'sealdah', 'West Bengal'),
('KDH', 'Khardah', 'sealdah', 'West Bengal'),
('CDH', 'Chakdah', 'sealdah', 'West Bengal'),
('PNBE', 'Patna', 'Danapur', 'Bihar'),
('MFP', 'Muzzafarpur', 'Sonepur', 'Bihar'),
('MGS', 'Mughalsarai', 'Mugalsarai', 'Uttar Pradesh'),
('GAYA', 'Gaya', 'Mugalsarai', 'Bihar'),
('DHN', 'Dhanbad', 'Dhanbad', 'Jharkhand'),
('DBG', 'Darbhanga', 'Samastipur', 'Bihar'),
('RJPB', 'Rajendra Nagar Terminal', 'Danapur', 'Bihar'),
('PPTA', 'Patliputra', 'Danapur', 'Bihar'),
('SPJ', 'Samastipur', 'Samastipur', 'Bihar'),
('SHC', 'Saharsa', 'Samastipur', 'Bihar'),
('ARA', 'Ara', 'Danapur', 'Bihar'),
('BXR', 'Buxar', 'Danapur', 'Bihar'),
('DNR', 'Danapur', 'Danapur', 'Bihar'),
('BJU', 'Barauni Jn.', 'Sonepur', 'Bihar'),
('HJP', 'Hajipur', 'Sonepur', 'Bihar'),
('KQR', 'Koderma', 'Dhanbad', 'Jharkhand'),
('BMKI', 'Banmankhi', 'Samastipur', 'Bihar'),
('DOS', 'Dehri On Sone', 'Mugalsarai', 'Bihar'),
('KIUL', 'Kiul', 'Danapur', 'Bihar'),
('KGG', 'Khagaria', 'Sonepur', 'Bihar'),
('RXL', 'Raxaul', 'Samastipur', 'Bihar'),
('SSM', 'Sasaram', 'Mugalsarai', 'Bihar'),
('BTH', 'Bettiah', 'Samastipur', 'Bihar'),
('JYG', 'Jainagar', 'Samastipur', 'Bihar'),
('PNME', 'Parasnath', 'Dhanbad', 'Jharkhand'),
('MBI', 'Madhubani', 'Samastipur', 'Bihar'),
('DTO', 'Daltengunj', 'Dhanbad', 'Jharkhand'),
('BKP', 'Bakhtiyarpur', 'Danapur', 'Bihar'),
('AUBR', 'Anugrah Narayan Road', 'Mugalsarai', 'Bihar'),
('SGL', 'Sugauli', 'Samastipur', 'Bihar'),
('NKE', 'Narkatiaganj', 'Samastipur', 'Bihar'),
('BGS', 'Begusarai', 'Sonepur', 'Bihar'),
('SKI', 'Sakari Jn', 'Samastipur', 'Bihar'),
('PNC', 'Patna Sahib', 'Danapur', 'Bihar'),
('SMI', 'Sitamadhi', 'Smastipur', 'Bihar'),
('JMU', 'Jamui', 'Danapur', 'Bihar'),
('MKA', 'Mokama', 'Danapur', 'Bihar'),
('JAJ', 'Jhanja', 'Danapur', 'Bihar'),
('SGRL', 'Singrauli', 'Dhanbad', 'Madhya Pradesh'),
('BBU', 'Bhabhua Road Mugal', 'Sarai', 'Bihar'),
('GHD', 'Garhwa Road', 'Dhanbad', 'Jharkhand'),
('MNE', 'Mansi Jn.', 'Sonepur', 'Bihar'),
('DLN', 'Dildarnagar', 'Danapur', 'Uttar Pradesh'),
('BUG', 'Bagha', 'Samastipur', 'Bihar'),
('NNA', 'Naugachia', 'Sonepur', 'Bihar'),
('SEE', 'Sonepur', 'Sonepur', 'Bihar'),
('BRKA', 'Barkakana', 'Dhanbad', 'Jharkhand'),
('JHD', 'Jahanabad', 'Danapur', 'Bihar'),
('TEA', 'Taregana', 'Danapur', 'Bihar'),
('FUT', 'Fatuha', 'Danapaur', 'Bihar'),
('BTA', 'Bihta', 'Danapur', 'Bihar'),
('BARH', 'Barh', 'Danapur', 'Bihar'),
('PURI', 'Puri Khurdh', 'Road', 'Orissa'),
('BAM', 'Brahmapur Khurdh', 'Road', 'Orissa'),
('CTC', 'Cuttack Khurdh', 'Road', 'Orissa'),
('VZM', 'Viizanagaram', 'Waltair', 'Andhra Pradesh'),
('SBP', 'Sambalpur', 'Sambalpur', 'Orissa'),
('KUR', 'Khurda Road Khurda', 'Road', 'Orissa'),
('CHE', 'Srikakulam', 'Waltair', 'Andhra Pradesh'),
('BHC', 'Bhadrak Khurda', 'Road', 'Orissa'),
('PSA', 'Palasa Khurda', 'Road', 'Andhra Pradesh'),
('RGDA', 'Rayagada', 'Waltair', 'Orissa'),
('JJKR', 'Jajpur-Keonjhar road Khurda', 'Road', 'Orissa'),
('DVD', 'Duvvada', 'Waltair', 'Andhra Pradesh'),
('BLGR', 'Bolangir', 'Sambalpur', 'Chhattisgrah'),
('TIG', 'Titlagrah', 'Sambalpur', 'Orissa'),
('BALU', 'Balugaon Khurda', 'Road', 'Orissa'),
('KSNG', 'Kesinga', 'Sambalpur', 'Orissa'),
('DLI', 'Delhi', 'Delhi', 'Delhi'),
('JAT', 'Jammu Tavi Firozpur Jammu', '&', 'Kashmir'),
('BSB', 'Varanasi', 'Lucknow', 'Uttar Pradesh'),
('LKO', 'Lucknow', 'Lucnow', 'Uttar Pradesh'),
('LDH', 'Ludhiana Jn', 'Firpzpur', 'Punjab'),
('HW', 'Haridwar', 'Muradabad', 'Uttarakhand'),
('UMB', 'Ambala Cantt.', 'Ambala', 'Haryana'),
('SNP', 'Sonipat', 'Delhi', 'Haryana'),
('BE', 'Bareilly', 'Moradabad', 'Uttar Pradesh'),
('DDN', 'Dehradun', 'Moradabad', 'Uttarakhand'),
('SVDK', 'Shri Mata Vaisno devi Katra Firozpur Jammu', '&', 'Kashmir'),
('MB', 'Moradabad', 'Moradabad', 'Uttar Pradesh'),
('SRE', 'Haharanpur', 'Ambala', 'Uttar Pradesh'),
('FD', 'Faizabad', 'Lucknow', 'Uttar Pradesh'),
('BTI', 'Bathinda', 'Ambala', 'Punjab'),
('PTKC', 'Pathankot Jn', 'Firozpur', 'Punjab'),
('MTC', 'Meerut City', 'Delhi', 'Uttar Pradesh'),
('SLN', 'Sultanpur', 'Lucknow', 'Uttar Pradesh'),
('JRC', 'Jalandhar City', 'Firozpur', 'Punjab'),
('SPN', 'Shahjahanpur', 'Moradabad', 'Uttar Pradesh'),
('KLK', 'Kalka', 'Ambala', 'Haryana'),
('PBH', 'Pratapgrah', 'Lucknow', 'Uttar Pradesh'),
('SHG', 'Shahgunj', 'Lucknow', 'Uttar Pradesh'),
('FZR', 'Firozpur Cantt', 'Firozpur', 'Punjab'),
('JNU', 'Jaunpur', 'Lucknow', 'Uttar Pradesh'),
('ABP', 'Akbarpur', 'Lucknow', 'Uttar Pradesh'),
('RBL', 'Raebareli', 'Lucknow', 'Uttar Pradesh'),
('RK', 'Roorkee', 'Moradabad', 'Uttarakhand'),
('ROK', 'Rohtak', 'Delhi', 'Haryana'),
('HRI', 'raichu', 'Moradabad', 'Uttar Pradesh'),
('MOZ', 'Muzaffar Nagar', 'Delhi', 'Uttar Pradesh'),
('PGW', 'Phagwara Jn.', 'Firozpur', 'Punjab'),
('PWL', 'Palwal', 'Delhi', 'Haryana'),
('RMU', 'Rampur', 'Moradabad', 'Uttar Pradesh'),
('UHP', 'Udhampur Firozpur Jammu', '&', 'Kashmir'),
('BOY', 'Bhadohi', 'Lucknow', 'Uttar Pradesh'),
('RPJ', 'Raj Pura', 'Ambala', 'Punjab'),
('JNH', 'Janghai', 'Lucknow', 'Uttar Pradesh'),
('PRG', 'Paryag', 'Lucknow', 'Uttar Pradesh'),
('PTK', 'Pathan kot Jn', 'Firozpur', 'Punjab'),
('HPU', 'Hapur', 'Moradabad', 'Uttar Pradesh'),
('ON', 'Unnao', 'Lucknow', 'Uttar Pradesh'),
('SIR', 'Sirhind', 'Ambala', 'Punjab'),
('KKDE', 'Kurukshetra', 'Delhi', 'Haryana'),
('BBK', 'Barabanki', 'Lucknow', 'Uttar Pradesh'),
('JOP', 'Jaunpur City', 'Lucknow', 'Uttar Pradesh'),
('PTA', 'Patiala', 'Ambala', 'Punjab'),
('BVH', 'Ballabhgrah', 'Delhi', 'Haryana'),
('AY', 'Ayodhya', 'Lucknow', 'Uttar Pradesh'),
('AME', 'Amethi', 'Lucknow', 'Uttar Pradesh'),
('CH', 'Chandausi', 'Moradabad', 'Uttar Pradesh'),
('NBD', 'Najibabad', 'Moradabad', 'Uttar Pradesh'),
('ABS', 'Abhohar Jn', 'Ambala', 'Punjab'),
('SBB', 'Sahibabad', 'Delhi', 'Uttar Pradesh'),
('BGZ', 'Bahdurgrah', 'Delhi', 'Haryana'),
('NNO', 'Nangloi', 'Delhi', 'Delhi'),
('NUR', 'Narela', 'Delhi', 'Delhi'),
('TKD', 'Tughlakabad', 'Delhi', 'Delhi'),
('MDNR', 'Modinagar', 'Delhi', 'Uttar Pradesh'),
('NOLI', 'Noli', 'Delhi', 'Uttar Pradesh'),
('GNU', 'Ganaur', 'Delhi', 'Haryana'),
('FDN', 'Faridabad New Town', 'Delhi', 'Haryana'),
('PTRD', 'Pataudi road', 'Delhi', 'Haryana'),
('BTU', 'Braut', 'Delhi', 'Uttar Pradesh'),
('AMRO', 'Amroha', 'Moradabad', 'Uttar Pradesh'),
('PM', 'Palam', 'Delhi', 'Delhi'),
('DSB', 'Delhi sadar bazar', 'Delhi', 'Delhi'),
('JHS', 'Jhansi', 'Jhansi', 'Uttar Pradesh'),
('MTJ', 'Mathura Agra', 'Cantt.', 'Uttar Pradesh'),
('AF', 'Agra Fort Agra', 'Cantt.', 'Uttar Pradesh'),
('ALJN', 'Aligarh', 'Allahabad', 'Uttar Pradesh'),
('COI', 'Chheoki', 'Allahabad', 'Uttar Pradesh'),
('MZP', 'Mirzapur', 'Allahabad', 'Uttar Pradesh'),
('ETW', 'Etawah', 'Allahabad', 'Uttar Pradesh'),
('TDL', 'Tundala', 'Allahabad', 'Uttar Pradesh'),
('BNDA', 'Banda', 'Jhansi', 'Uttar Pradesh'),
('MRA', 'Morena', 'Jhansi', 'Madhya Pradesh'),
('LAR', 'Lalitpur', 'Jhansi', 'Uttar Pradesh'),
('CKTD', 'Chitrakut Dham', 'Jhansi', 'Uttar Pradesh'),
('MBA', 'Mahoba', 'Jhansi', 'Uttar Pradesh'),
('FTP', 'Fatehpur', 'Allahabad', 'Uttar Pradesh'),
('RKM', 'Raja ki Mandi Agra', 'Cantt.', 'Uttar Pradesh'),
('MKP', 'Manikpur', 'Jhansi', 'Uttar Pradesh'),
('ORAI', 'Orai', 'Jhansi', 'Uttar Pradesh'),
('KURJ', 'Khajuraho', 'Jhansi', 'Madhya Pradesh'),
('PHD', 'Phaphund', 'Allahabad', 'Uttar Pradesh'),
('DAA', 'Datia', 'Jhansi', 'Madhya Pradesh'),
('DHO', 'Dholpur Jn. Agra', 'Cantt.', 'Rajasthan'),
('DBA', 'Dabra', 'Jhansi', 'Madhya Pradesh'),
('DER', 'Dadri', 'Allahabad', 'Uttar Pradesh'),
('KRJ', 'Khurja', 'Allahabad', 'Uttar Pradesh'),
('GKP', 'Gorakhpur Jn', 'Lucknow', 'Uttar Pradesh'),
('LJN', 'Lucknow Jn', 'Lucknow', 'Uttar Pradesh'),
('CPR', 'Chhapra Jn', 'Varanasi', 'Bihar'),
('SV', 'Siwan', 'Varanasi', 'Bihar'),
('GD', 'Gonda Jn', 'Lucknow', 'Uttar Pradesh'),
('MUV', 'Manduwadih', 'Varanasi', 'Uttar Pradesh'),
('BST', 'Basti', 'Lucknow', 'Uttar Pradesh'),
('AMH', 'Azamgrah', 'Varanasi', 'Uttar Pradesh'),
('BUI', 'Ballia', 'Varanasi', 'Uttar Pradesh'),
('MAU', 'Mau Jn', 'Varanasi', 'Uttar Pradesh'),
('DEOS', 'Deoria Sadar', 'Varanasi', 'Uttar Pradesh'),
('KGM', 'Kathgodam', 'Izzatnagar', 'Uttarakhand'),
('KLD', 'Khalilabad', 'Lucknow', 'Uttar Pradesh'),
('FBD', 'Farrukhabad', 'Izzatnagar', 'Uttar Pradesh'),
('GCT', 'Ghazipur City', 'Varanasi', 'Uttar Pradesh'),
('RUPC', 'Rudrapur Ciry', 'Izzatnagar', 'Uttar Pradesh'),
('BLTR', 'Betlthara Road', 'Varanasi', 'Uttar Pradesh'),
('BNZ', 'Badshahnagar', 'Lucknow', 'Uttar Pradesh'),
('KSJ', 'Kasganj Jn.', 'Izzatnagar', 'Uttar Pradesh'),
('KJN', 'Kannauj', 'Izzatnagar', 'Uttar Pradesh'),
('BCY', 'Varanasi', 'Varanasi', 'Uttar Pradesh'),
('BTT', 'Bhatni', 'Varanasi', 'Uttar Pradesh'),
('LKU', 'Lalkuan Jn.', 'Izzatnagar', 'Uttarakhand'),
('HDW', 'Haldwani', 'Izzatnagar', 'Uttar Pradesh'),
('MUR', 'Mankapur Jn.', 'Lucknow', 'Uttar Pradesh'),
('KPV', 'Kashipur', 'Izzatnagar', 'Uttarakhand'),
('PBE', 'Pilibhit Jn.', 'Izzatnagar', 'Uttar Pradesh'),
('BC', 'Bareilly City', 'Izzatnagar', 'Uttar Pradesh'),
('GHY', 'Guwahati', 'Lumding', 'Assom'),
('NJP', 'New Jalpaiguri', 'Katihar', 'West Bengal'),
('KIR', 'Katihar', 'Katihar', 'Bihar'),
('KYQ', 'Kamakhya', 'Lumding', 'Assom'),
('DMV', 'Dimapur', 'Lumding', 'Nagaland'),
('KNE', 'Kishanganj', 'Katihar', 'Bihar'),
('NCB', 'New Coochbehar Alipur', 'Dwar', 'West Bengal'),
('NTSK', 'New Tinsukia', 'Tinsukia', 'Assom'),
('DBRT', 'Dibrugarh Town', 'Tinsukia', 'Assom'),
('NBQ', 'New Bongaigaon', 'Rangiya', 'Assom'),
('RNY', 'Rangiya Jn.', 'Rangiya', 'Assom'),
('MXN', 'Mariyani Jn.', 'Tinsukia', 'Assom'),
('NOQ', 'New Alipurduar', 'Alipurduar', 'West Bengal'),
('BOE', 'Barsoi Jn.', 'Katihar', 'Bihar'),
('DBRG', 'Dibrugarh', 'Tinsukia', 'Assom'),
('SCL', 'Silchar', 'Lumding', 'Assom'),
('JBN', 'Jogbani', 'Katihar', 'Bihar'),
('LMG', 'Lumding', 'Lumding', 'Assom'),
('RGJ', 'Raiganj', 'Katihar', 'West Bengal'),
('BPRD', 'Barpeta Road', 'Rangiya', 'Assom'),
('APDJ', 'Alipurduar Jn.', 'Alipurduar', 'West Bengal'),
('DQG', 'Dhupguri', 'Alipurduar', 'West Bengal'),
('KOJ', 'Kokrajhar', 'Alipurduar', 'Assom'),
('SGUJ', 'Siliguri Jn.', 'Katihar', 'West Bengal'),
('PRNA', 'Purnea', 'Katihar', 'Bihar'),
('ARQ', 'Araria Court', 'Katihar', 'Bihar'),
('BKN', 'Bikaner', 'Bikaner', 'Rajasthan'),
('ABR', 'Abu Road', 'Ajmer', 'Rajasthan'),
('RE', 'Rewari', 'Jaipur', 'Haryana'),
('AWR', 'Alwar', 'Jaipur', 'Rajasthan'),
('FA', 'Falna', 'Ajmer', 'Rajasthan'),
('SGNR', 'Sri Ganga Nagar', 'Bikaner', 'Rajasthan'),
('HSR', 'Hisar', 'Bikaner', 'Haryana'),
('JSM', 'Jaisalmer', 'Jodhpur', 'Rajasthan'),
('BHL', 'Bhilwara', 'Ajmer', 'Rajasthan'),
('BKI', 'Bandikui', 'Jaipur', 'Rajasthan'),
('SOG', 'Suratgarh', 'Bikaner', 'Rajasthan'),
('NGO', 'Nagaur', 'Jodhpur', 'Rajasthan'),
('MJ', 'Marwar Jn.', 'Ajmer', 'Rajasthan'),
('PMY', 'Pali Marwar', 'Jodhpur', 'Rajasthan'),
('BME', 'Barmer', 'Jodhpur', 'Rajasthan'),
('BGKT', 'Bhagar Ki Kothi', 'Jodhpur', 'Rajasthan'),
('LGH', 'Lalgarh', 'Bikaner', 'Rajasthan'),
('HMH', 'Hanumangarh Jn.', 'Bikaner', 'Rajasthan'),
('BNW', 'Bhiwani', 'Bikaner', 'Haryana'),
('MTD', 'Merta Road', 'Jodhpur', 'Rajasthan'),
('DO', 'Dausa', 'Jaipur', 'Rajasthan'),
('KSG', 'Kishangarh', 'Jaipur', 'Rajasthan'),
('FL', 'Phulera', 'Jaipur', 'Rajasthan'),
('DPA', 'Durgapura', 'Jaipur', 'Rajasthan'),
('BER', 'Beawar', 'Ajmer', 'Rajasthan'),
('SSA', 'Sirsa', 'Bikaner', 'Haryana'),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
('MS', 'Chennai Egmore', 'Chennai', 'Tamil Nadu'),
('TBM', 'Tambram', 'Chennai', 'Tamil Nadu'),
('CBE', 'Coimbatore Jn.', 'Salem', 'Tamil Nadu'),
('TVC', 'Tiruvananthapuram Central', 'Tiruchchirappalli', 'Tamil Nadu'),
('MDU', 'Madurai Jn.', 'Madurai', 'Tamil Nadu'),
('CLT', 'Kozhikkode', 'Palghat', 'Kerala'),
('KPD', 'Katpadi', 'Chennai', 'Tamil Nadu'),
('TCR', 'Thrisur', 'Trivandrum', 'Kerala'),
('CGL', 'Chengalpattu Jn.', 'Chennai', 'Tamil Nadu'),
('AJJ', 'Arakkonam Jn.', 'Chennai', 'Tamil Nadu'),
('TRL', 'Tiruvallur', 'Chennai', 'Tamil Nadu'),
('TPJ', 'Tiruchchirappalli Jn', 'Tiruchchirappalli', 'Tamil Nadu'),
('TEN', 'Tirunelveli Jn.', 'Maduri', 'Tamil Nadu'),
('MAQ', 'Mangalore Central', 'Palghat', 'Karnataka'),
('ED', 'Erode Jn', 'Salem', 'Tamil Nadu'),
('SA', 'Salem Jn.', 'Salem', 'Tamil Nadu'),
('CAN', 'Kannur', 'Palghat', 'Kerala'),
('ERN', 'Eraniel', 'Trivandrum', 'Tamil Nadu'),
('TUP', 'Tiruppur', 'Salem', 'Tamil Nadu'),
('AWY', 'Aluva', 'Trivendrum', 'Kerala'),
('PGT', 'Palakkad jn', 'Palghat', 'Kerala'),
('QLN', 'Kollam Jn', 'Trivandrum', 'Kerala'),
('KTYM', 'Kottayam', 'Trivandrum', 'kerala'),
('SRR', 'Shoranur Jn', 'Palghat', 'Kerala'),
('CNGR', 'Chengannur', 'Trivandrum', 'Kerala'),
('NCJ', 'Nagercoil Jn.', 'Trivandrum', 'Tamil Nadu'),
('KYJ', 'Kayankulam Jn', 'Trivandrum', 'Kerala'),
('TLY', 'Thalassery', 'Palghat', 'Kerala'),
('TJ', 'Thanjavur Jn', 'Tiruchchirappalli', 'Tamil Nadu'),
('MAJN', 'Mangalore Jn', 'Palghat', 'Karnataka'),
('DG', 'Dindigul Jn', 'Madurai', 'Tamil Nadu'),
('RMM', 'Rameswaram', 'Madurai', 'Tamil Nadu'),
('TN', 'Tutikorin', 'Madurai', 'Tamil Nadu'),
('JTJ', 'Jolarpattai', 'Chennai', 'Tamil Nadu'),
('TIR', 'Tirur', 'Palghat', 'Kerala'),
('VM', 'Villupuram Jn', 'Tiruchchirappalli', 'Tamil Nadu'),
('KCVL', 'Kochuvalli', 'Trivandrum', 'Kerala'),
('ALLP', 'Alppuzha', 'Trivandrum', 'Kerala'),
('PER', 'Perambur', 'Chennai', 'Tamil Nadu'),
('MBM', 'Mambalam', 'Chennai', 'Tamil Nadu'),
('GI', 'Guduvancheri', 'Chennai', 'Tamil Nadu'),
('PRGL', 'Perungalathur', 'Chennai', 'Tamil Nadu'),
('CAPE', 'Kanniyakumari', 'Trivandrum', 'Tamil Nadu'),
('BDJ', 'Vadakara', 'Palghat', 'kerala'),
('KGQ', 'kasargod', 'Palghat', 'kerala'),
('TRVL', 'Tiruvalla', 'Trivandrum', 'kerala'),
('KMU', 'kumbakonam', 'Tiruchchirappalli', 'Tamil Nadu'),
('PAY', 'Payyannur', 'Palghat', 'kerala'),
('CVP', 'Kovilpatti', 'Madurai', 'Tamil Nadu'),
('VPT', 'Virudhunagar Jn', 'Madurai', 'Tamil Nadu'),
('MV', 'Mayiladuthurai Jn', 'Tiruchchirappalli', 'Tamil Nadu'),
('NGT', 'Nagappattinam', 'Tiruchchirappalli', 'Tamil Nadu'),
('KZE', 'Kanhangad', 'Palghat', 'Kerala'),
('KRR', 'Karur Jn.', 'Salem', 'Tamil Nadu'),
('RMD', 'Ramanathapuram', 'Madurai', 'Tamil Nadu'),
('KTU', 'Kuttipuram', 'Palghat', 'Kerala'),
('MTP', 'Mettupalaiyam', 'Salem', 'Tamil Nadu'),
('CGY', 'Changanacheri', 'Trivandrum', 'kerala'),
('VAK', 'Varkalashivagiri', 'Trivandrum', 'Kerala'),
('TRT', 'Tiruttani', 'Chennai', 'Tamil Nadu'),
('SKL', 'Singaperumalkoil', 'Chennai', 'Tamil Nadu'),
('AFK', 'Angamali for Kaladi', 'Trivandrum', 'Kerala'),
('HYB', 'Hyderabad', 'Secunderabad', 'Andhra Pradesh'),
('KCG', 'Kacheguda', 'Hyderabad', 'Telangana'),
('NED', 'Huzur Saheb Nanded', 'Nanded', 'Maharashtra'),
('RJY', 'Rajahmundry', 'Vijayawada', 'Andhra Pradesh'),
('AWB', 'Aurangabad', 'Nanded', 'Maharashtra'),
('RU', 'Renigunta', 'Guntakal', 'Andhra Pradesh'),
('GNT', 'Guntur', 'Guntur', 'Andhra Pradesh'),
('WL', 'Warangal', 'Secunderabad', 'Andhra Pradesh'),
('SLO', 'Samalkot', 'Vijayawada', 'Andhra Pradesh'),
('KZJ', 'Kazipet Jn', 'Secundarabad', 'Andhra Pradesh'),
('OGL', 'Ongole', 'Vijayawada', 'Andhra Pradesh'),
('KMT', 'Khammam', 'Secunderabad', 'Andhra Pradesh'),
('GTL', 'Guntakal', 'Guntakal', 'Andhra Pradesh'),
('GDR', 'Gudur', 'Vijayawada', 'Andhra Pradesh'),
('CCT', 'Kakinada Tn.', 'Vijayawada', 'Andhra Pradesh'),
('RC', 'Raichur', 'Guntakal', 'Karnataka'),
('PBN', 'Parbhani', 'Nanded', 'Maharashtra'),
('NSL', 'Nagarsol', 'Nanded', 'Maharashtra'),
('TEL', 'Tenali', 'Vijayawada', 'Andhra Pradesh'),
('ATP', 'Anatpur', 'Guntakal', 'Andhra Pradesh'),
('NZB', 'Nizamabad', 'Hyderabad', 'Andhra Pradesh'),
('YG', 'Yadgir', 'Guntakal', 'Karnataka'),
('EE', 'Eluru', 'Vijayawada', 'Andhra Pradesh'),
('BVRT', 'Bhimavaram Tn.', 'Vijayawada', 'Andhra Pradesh'),
('HX', 'Cuddapah', 'Guntakal', 'Andhra Pradesh'),
('LPI', 'Lingampalli', 'Secunderabad', 'Telangana'),
('KRNT', 'Kurnool Tn', 'Hyderabad', 'Andhra Pradesh'),
('AKP', 'Anakapalli', 'Vijayawada', 'Andhra Pradesh'),
('J', 'Jalna', 'Nanded', 'Maharashtra'),
('TDD', 'Tadepalligudem', 'Vijayawada', 'Andhra Pradesh'),
('CLX', 'Chirala', 'Vijayawada', 'Andhra Pradesh'),
('TUNI', 'Tuni', 'Vijayawada', 'Andhra Pradesh'),
('MCI', 'Manchiryal', 'Secundarabad', 'Andhra Pradesh'),
('BIDR', 'Bidar', 'Secundarabad', 'Karnataka'),
('AD', 'Adoni', 'Guntakal', 'Andhra Pradesh'),
('COA', 'Kakinada Port (new)', 'Vijayawada', 'Andhra Pradesh'),
('RDM', 'Ramagundam', 'Secundarabad', 'Andhra Pradesh'),
('DMM', 'Dharmavaram', 'Guntakal', 'Andhra Pradesh'),
('NS', 'Narasapur', 'Vijayawada', 'Andhra Pradesh'),
('BDCR', 'Bhadrachalam Rd.', 'Secundarabad', 'Andhra Pradesh'),
('MALM', 'Mantralayam Rd.', 'Guntakal', 'Andhra Pradesh'),
('GDV', 'Gudivada', 'Vijayawada', 'Andhra Pradesh'),
('MABD', 'Mahbubabad', 'Secundarabad', 'Andhra Pradesh'),
('BMT', 'Begumpet', 'Secundarabad', 'Andhra Pradesh'),
('NDL', 'Nandyal', 'Guntur', 'Andhra Pradesh'),
('TDU', 'Tandur', 'Secundarabad', 'Telangana'),
('CTO', 'Chittoor', 'Guntakal', 'Andhra Pradesh'),
('VKB', 'Vikarabad', 'Secundarabad', 'Telangana'),
('RAL', 'Repalli', 'Guntur', 'Andhra Pradesh'),
('TATA', 'Tatanagar', 'Chakradharpur', 'Jharkhand'),
('KGP', 'Kharagpur', 'Kharagpur', 'West Bengal'),
('ROU', 'Rourkela', 'Chakradharpur', 'Orissa'),
('HTE', 'Hatia', 'Ranchi', 'Jharkhand'),
('SHM', 'Shalimar', 'Kharagpur', 'West Bengal'),
('JSG', 'Jharsuguda', 'Chakradharpur', 'Orissa'),
('BKSC', 'Bokaro Steel City', 'Adra', 'Jharkhand'),
('BLS', 'Balasore', 'Kharagpur', 'Orissa'),
('CKP', 'Chakradharpur', 'Chakradharpur', 'Jharkhand'),
('PRR', 'Purulia Jn.', 'Adra', 'West Bengal'),
('DGHA', 'Digha', 'Kharagpur', 'West Bengal'),
('BQA', 'Bankura Jn.', 'Adra', 'West Bengal'),
('MDN', 'Midnapur', 'Kharagpur', 'West Bengal'),
('ADRA', 'Adra', 'Adra', 'West Bengal'),
('JGM', 'Jhargram', 'Kharagpur', 'West Bengal'),
('R', 'Raipur', 'Raipur', 'Chattisgarh'),
('BSP', 'Bilaspur', 'Bilaspur', 'Chattisgarh'),
('DURG', 'Durg', 'Raipur', 'Chattisgarh'),
('G', 'Gondia Nagpur', '(SECR)', 'Maharashtra'),
('RIG', 'Raigharh', 'Bilaspur', 'Chattisgarh'),
('CPH', 'CPH', 'Bilaspur', 'Chattisgarh'),
('APR', 'Anuppur', 'Bilaspur', 'Madhya Pradesh'),
('RJN', 'Rajnandgaon Nagpur', '(SECR)', 'Chattisgarh'),
('SDL', 'Shahdol', 'Bilaspur', 'Madhya Pradesh'),
('BYT', 'Bhatapara', 'Raipur', 'Chattisgarh'),
('KRBA', 'Korba', 'Bilaspur', 'Chattisgarh'),
('BPHB', 'Bhilai Power House', 'Raipur', 'Chattisgarh'),
('ABKP', 'Ambikapur', 'Bilaspur', 'Chattisgarh'),
('ITR', 'Itwari Nagpur', '(SECR)', 'Maharashtra'),
('DGG', 'Dongargadh Nagpur', '(SECR)', 'Chattisgarh'),
('MYS', 'Mysore', 'Mysore', 'Karnataka'),
('UBL', 'Hubli Junction', 'Hubli', 'Karnataka'),
('KJM', 'Autocomplete Station', 'Bangalore', 'Karnataka'),
('VSG', 'Vasco-da-gama', 'Hubli', 'Goa'),
('BAY', 'Bellary Jn.', 'Hubli', 'Karnataka'),
('DVG', 'Davangere', 'Mysore', 'Karnataka'),
('BWT', 'Bangarapet', 'Bangalore', 'Karnataka'),
('MYA', 'Mandya', 'Bangalore', 'Karnataka'),
('HPT', 'Hospet Jn.', 'Hubli', 'Karnataka'),
('KGI', 'Kengeri', 'Bangalore', 'Karnataka'),
('BJP', 'Bijapur', 'Hubli', 'Karnataka'),
('SSPN', 'Srisatyasaiprashanthinilayam', 'Bangalore', 'Andhra Pradesh'),
('SMET', 'Shimoga Tn.', 'Mysore', 'Karnataka'),
('GDG', 'Gadag Jn.', 'Hubli', 'Karnataka'),
('ASK', 'Arsikere', 'Mysore', 'Karnataka'),
('YNK', 'Yelahanka', 'Bangalore', 'Karnataka'),
('HSRA', 'Hosur', 'Bangalore', 'Tamil Nadu'),
('TK', 'Tumkur', 'Bangalore', 'Karnataka'),
('MLO', 'Malur', 'Bangalore', 'Karnataka'),
('CPT', 'Channapatna', 'Bangalore', 'Karnataka'),
('RMGM', 'Ramanagaram', 'Bangalore', 'Karnataka'),
('WFD', 'Whitefield', 'Bangalore', 'Karnataka'),
('NTW', 'Nanjangud Tn', 'Mysore', 'Karnataka'),
('KPN', 'Kuppam', 'Bangalore', 'Andhra Pradesh'),
('BRC', 'Vadodara Jn.', 'Vadodara', 'Gujarat'),
('UJN', 'Ujjain', 'Ratlam', 'Madhya Pradesh'),
('NVS', 'Navsari', 'Mumbai', 'Gujarat'),
('RJT', 'Rajkot', 'Rajkot', 'Gujarat'),
('VAPI', 'Vapi', 'Mumbai', 'Gujarat'),
('RTM', 'Ratlam', 'Ratlam', 'Madhya Pradesh'),
('JAM', 'Jamnagar', 'Rajkot', 'Gujarat'),
('BH', 'Bharuch Jn.', 'Vadodara', 'Gujarat'),
('GIMB', 'Gandhidham', 'Ahmedabad', 'Gujarat'),
('BHUJ', 'Bhuj', 'Ahmedabad', 'Gujarat'),
('ANND', 'Anand', 'Vadodara', 'Gujarat'),
('COR', 'Chittorgarh', 'Ratlam', 'Rajasthan'),
('AKV', 'Ankleshwar', 'Vadodara', 'Gujarat'),
('ND', 'Nadiad', 'Vadodara', 'Gujarat'),
('BIM', 'Bilimora', 'Mumbai', 'Gujarat'),
('VRL', 'Veraval', 'Bhavnagar', 'Gujarat'),
('BVC', 'Bhavnagar', 'Bhavnagar', 'Gujarat'),
('DWK', 'Dwarka', 'Rajkot', 'Gujarat'),
('DHD', 'Dahod', 'Ratlam', 'Gujarat'),
('NAD', 'Nagda', 'Ratlam', 'Madhya Pradesh'),
('SUNR', 'Surendranagar', 'Rajkot', 'Gujarat'),
('DWX', 'Dewas', 'Ratlam', 'Madhya Pradesh'),
('JND', 'Junagarh', 'Bhavnagar', 'Gujarat'),
('WKR', 'Wankaner', 'Rajkot', 'Gujarat'),
('VG', 'Viramgam', 'Ahmedabad', 'Gujarat'),
('SIOB', 'Samakhiali', 'Ahmedabad', 'Gujarat'),
('NMH', 'Nimach', 'Ratlam', 'Madhya Pradesh'),
('KSB', 'Kosamba', 'Vadodara', 'Gujarat'),
('MHD', 'Mahemadabad & Kheda Road', 'Vadodara', 'Gujarat'),
('BTD', 'Botad', 'Bhavnagar', 'Gujarat'),
('MYG', 'Miyagam Karjan Jn.', 'Vadodara', 'Gujarat'),
('UBR', 'Umbergaon', 'Mumbai', 'Gujarat'),
('KIM', 'Kim', 'Vadodara', 'Gujarat'),
('VR', 'Virar', 'Mumbai', 'Maharashtra'),
('BYR', 'Bhayandar', 'Mumbai', 'Maharashtra'),
('CCG', 'Churchgate', 'Mumbai', 'Maharashtra'),
('BSR', 'Vasai Road', 'Mumbai', 'Maharashtra'),
('NSP', 'Nallasopara', 'Mumbai', 'Maharashtra'),
('MDD', 'Malad', 'Mumbai', 'Maharashtra'),
('GMN', 'Goregaon', 'Mumbai', 'Maharashtra'),
('VTN', 'Vaitarana', 'Mumbai', 'Maharashtra'),
('KILE', 'Kandivali', 'Mumbai', 'Maharashtra'),
('VLP', 'Vile Parley', 'Mumbai', 'Maharashtra'),
('BOR', 'Boisar', 'Mumbai', 'Maharashtra'),
('MIRA', 'Mira Road', 'Mumbai', 'Maharashtra'),
('STC', 'Santacruz', 'Mumbai', 'Maharashtra'),
('JOS', 'Jogeshwari', 'Mumbai', 'Maharashtra'),
('PLG', 'Palghar', 'Mumbai', 'Maharashtra'),
('DIC', 'Dahisar', 'Mumbai', 'Maharashtra'),
('MM', 'Mahim', 'Mumbai', 'Maharashtra'),
('KHAR', 'Khar Road', 'Mumbai', 'Maharashtra'),
('GTR', 'Grant Road', 'Mumbai', 'Maharashtra'),
('DRD', 'Dahanu Raod', 'Mumbai', 'Maharashtra'),
('EPR', 'Elphinstone Road', 'Mumbai', 'Maharashtra'),
('CYR', 'Charni Road', 'Mumbai', 'Maharashtra'),
('JBP', 'Jabalpur Junction', 'Jabalpur', 'Madhya Pradesh'),
('STA', 'Satna', 'Jabalpur', 'Madhya Pradesh'),
('KTE', 'Katni', 'Jabalpur', 'Madhya Pradesh'),
('REWA', 'Rewa', 'Jabalpur', 'Madhya Pradesh'),
('SWM', 'Sawaimadhopur', 'Kota', 'Rajasthan'),
('SGO', 'Saugor', 'Jabalpur', 'Madhya Pradesh'),
('BINA', 'Bina', 'Bhopal', 'Madhya Pradesh'),
('BTE', 'Bharatpur', 'Kota', 'Rajasthan'),
('MYR', 'Maihar', 'Jabalpur', 'Madhya Pradesh'),
('DMO', 'Damoh', 'Jabalpur', 'Madhya Pradesh'),
('GUNA', 'Guna', 'Bhopal', 'Madhya Pradesh'),
('PPI', 'Pipariya', 'Jabalpur', 'Madhya Pradesh'),
('GGC', 'Gangapur City', 'Kota', 'Rajasthan'),
('BHS', 'Vidisha', 'Bhopal', 'Madhya Pradesh'),
('HBD', 'Hoshangabad', 'Bhopal', 'Madhya Pradesh'),
('NU', 'Narshinghpur', 'Jabalpur', 'Madhya Pradesh'),
('HAN', 'Hindaun City', 'Kota', 'Rajasthan'),
('BAQ', 'Ganjbasoda', 'Bhopal', 'Madhya Pradesh'),
('DKNT', 'Dakaniya Talav', 'Kota', 'Rajasthan'),
('PGMD', 'Pragati Maidan', 'Delhi', 'Delhi'),
('DBSI', 'Daya Basti', 'Delhi', 'Delhi'),
('KRTN', 'Kirti Nagar', 'Delhi', 'Delhi'),
('NRVR', 'Naraina Vihar', 'Delhi', 'Delhi'),
('DLPI', 'Delhi Inderpuri', 'Delhi', 'Delhi'),
('BRSQ', 'Brar Square', 'Delhi', 'Delhi'),
('SDPR', 'Sardar Patel Marg', 'Delhi', 'Delhi'),
('SOJ', 'Sarojini Nagar', 'Delhi', 'Delhi'),
('LDCY', 'Lodhi Colony', 'Delhi', 'Delhi'),
('SWNR', 'Sewa Nagar', 'Delhi', 'Delhi'),
('PZA', 'PALAVANTANGAL Chennai', 'Central', 'TN'),
('AVD', 'AVADI Chennai', 'Central', 'TN'),
('BZN', 'BAGNAN', 'KHARAGPUR', 'WB'),
('PKU', 'PANSKURA', 'KHARAGPUR', 'WB'),
('MCA', 'MECHEDA', 'KHARAGPUR', 'WB'),
('VLCY', 'Velachery', 'Chennai', 'TAMILNADU'),
('PRGD', 'Perungudi', 'Chennai', 'TAMILNADU'),
('TRMN', 'Taramani', 'Chennai', 'TAMILNADU'),
('TYMR', 'Thiruvanmiyur', 'Chennai', 'TAMILNADU'),
('INDR', 'Indira Nagar', 'Chennai', 'TAMILNADU'),
('KTBR', 'Kasturba Nagar', 'Chennai', 'TAMILNADU'),
('KTPM', 'Kotturpuram', 'Chennai', 'TAMILNADU'),
('GWGR', 'Greenways Road', 'Chennai', 'TAMILNADU'),
('MNDY', 'Mandaveli', 'Chennai', 'TAMILNADU'),
('MTMY', 'Thirumayilai', 'Chennai', 'TAMILNADU'),
('MLHS', 'Light House', 'Chennai', 'TAMILNADU'),
('MTCN', 'Thiruvallikeni', 'Chennai', 'TAMILNADU'),
('MCPK', 'Chepauk', 'Chennai', 'TAMILNADU'),
('MCPT', 'Chintadripet', 'Chennai', 'TAMILNADU'),
('MPKT', 'Chennai Park Town', 'Chennai', 'Tamil Nadu'),
('GDY', 'Guindy', 'Chennai', 'Tamil Nadu'),
('SP', 'Saidapet', 'Chennai', 'Tamil Nadu'),
('MKK', 'Kodambakkam', 'Chennai', 'Tamil Nadu'),
('NBK', 'Nungambakkam', 'Chennai', 'Tamil Nadu'),
('MSC', 'Chetput', 'Chennai', 'Tamil Nadu'),
('PEW', 'Perambur Loco Works', 'Chennai', 'Tamil Nadu'),
('PCW', 'Perambur Carriage Works', 'Chennai', 'Tamil Nadu'),
('VJM', 'Vyasarpadi Jeeva', 'Chennai', 'Tamil Nadu'),
('TNP', 'Tondiarpet', 'Chennai', 'Tamil Nadu'),
('KOK', 'Korukkupet', 'Chennai', 'Tamil Nadu'),
('MPK', 'Chennai Park', 'Chennai', 'Tamil Nadu'),
('MSF', 'Chennai Fort', 'Chennai', 'Tamil Nadu'),
('WST', 'Washermanpet', 'Chennai', 'Tamil Nadu'),
('BBQ', 'Basin Bridge', 'Chennai', 'Tamil Nadu'),
('RPM', 'Royapuram', 'Chennai', 'Tamil Nadu'),
('MMCC', 'Moore Market Complex', 'Chennai', 'Tamil Nadu'),
('MSB', 'Chennai Beach', 'Chennai', 'Tamil Nadu'),
('SSP', 'Santoshpur', 'Sealdah', 'West Bengal'),
('TLG', 'Tollyganj', 'Sealdah', 'West Bengal'),
('BGJT', 'Baghajatin', 'Sealdah', 'West Bengal'),
('BRJ', 'Brace Bridge', 'Sealdah', 'West Bengal'),
('DDC', 'Dum Dum Cant', 'Sealdah', 'West Bengal'),
('BLN', 'Ballygunge', 'Sealdah', 'West Bengal'),
('DHK', 'Dhakuria', 'Sealdah', 'West Bengal'),
('EDG', 'Eden Garden', 'Sealdah', 'West Bengal'),
('BEQ', 'Belur', 'Howrah', 'West Bengal'),
('TPKR', 'Tikiapara', 'Kharagpur', 'WB'),
('LLH', 'Liluah', 'Howrah', 'West Bengal'),
('BBT', 'Birati', 'Sealdah', 'West Bengal'),
('MJT', 'Majerhat', 'Sealdah', 'West Bengal'),
('KIRP', 'Khidirpur', 'Sealdah', 'West Bengal'),
('PPGT', 'Princep Ghat', 'Sealdah', 'West Bengal'),
('AGP', 'Agarpara', 'Sealdah', 'West Bengal'),
('SRC', 'Santragachi Junction', 'Kharagpur', 'West Bengal'),
('VVH', 'Vidyavihar Mumbai', 'VT', 'Maharashtra'),
('TKNG', 'Tilak nagar Mumbai', 'VT', 'MAHARASHTRA'),
('SVE', 'Sewri Mumbai', 'VT', 'Maharashtra'),
('SNRD', 'Sandhurst Road Mumbai', 'VT', 'Maharashtra'),
('RRD', 'Reay Road Mumbai', 'VT', 'Maharashtra'),
('MRU', 'Matunga Road Mumbai', 'Central', 'MH'),
('MTN', 'Matunga Mumbai', 'VT', 'Maharashtra'),
('MEL', 'Marine Lines Mumbai', 'Central', 'MH'),
('MSD', 'Bombay Masjid Mumbai', 'VT', 'Maharashtra'),
('MX', 'Mahalaxmi Mumbai', 'Central', 'MH'),
('DKRD', 'Dockyard Road Mumbai', 'VT', 'Maharashtra'),
('CRD', 'Currey Road Mumbai', 'VT', 'Maharashtra'),
('CTGN', 'Cotton Green Mumbai', 'VT', 'Maharashtra'),
('CHF', 'Chunabhatti Mumbai', 'VT', 'MAHARASHTRA'),
('CHG', 'Chinchpokli Mumbai', 'VT', 'Maharashtra'),
('BAP', 'CBD Belapur Mumbai', 'VT', 'Maharashtra'),
('VVB', 'Viveka Vihar', 'DLI', 'Delhi'),
('TKJ', 'Tilak Bridge', 'DLI', 'Delhi'),
('SZM', 'Subji Mandi', 'DLI', 'Delhi'),
('CSB', 'Shivaji Bridge', 'DLI', 'Delhi'),
('OKA', 'Okhla', 'DLI', 'Delhi'),
('MGP', 'Mongolpuri', 'DLI', 'Delhi'),
('DSJ', 'Delhi Sadarjung', 'DLI', 'Delhi'),
('DKZ', 'Kishanganj', 'DLI', 'Delhi'),
('BHD', 'Badli', 'DLI', 'Delhi'),
('GTNR', 'Gomati Nagar', 'Lucknow', 'Uttar Pradesh'),
('RANI', 'Rani', 'Ajmer', 'Rajasthan'),
('MUT', 'MEERUT CANTT.', 'Delhi', 'Uttar Pradesh'),
('JTTN', 'Jorhat Town', 'Tinsukia', 'Assam'),
('JUD', 'Jagadhri', 'Ambala', 'Haryana'),
('GMO', 'Gomoh Jn.', 'Dhanbad', 'Jharkhand'),
('COB', 'Coochbehar', 'Alipudawar', 'West Bengal'),
('BNGN', 'Bongaigaon', 'Rangia', 'Assam'),
('BRD', 'Bhandara Road', 'Nagpur', 'Maharashtra'),
('UHL', 'Una Ambala', 'Himachal', 'Pradesh'),
('KPLH', 'Kottipali', 'Vijayawada', 'Andhra Pradesh'),
('ANSB', 'Anandpur sahib', 'Amabala', 'Punjab'),
('AO', 'Aonla', 'Moradabad', 'Uttar Pradesh'),
('BRK', 'Bahraich', 'Lucknow', 'Uttar Pradesh'),
('BTC', 'Balaghat', 'Nagpur', 'Madhya Pradesh'),
('JDB', 'Jagdalpur', 'waltair', 'Chhattisgarh'),
('PNF', 'Pangaon', 'Secundrabad', 'Maharashtra'),
('BJO', 'Bijnor', 'Moradabad', 'Uttar Pradesh'),
('BSC', 'Bulandshaher', 'Moradabad', 'Uttar Pradesh'),
('CUR', 'Churu', 'Bikaner', 'Rajasthan'),
('DHI', 'Dhule', 'Bhusawal', 'Maharashtra'),
('FTS', 'Fathepur Sikri Agra', 'Cantt.', 'Uttar Pradesh'),
('KTW', 'Kotdwara', 'Moradabad', 'Uttarakhand'),
('HRS', 'Hathras', 'Allahabad', 'Uttar Pradesh'),
('JJN', 'Jhunjhunu', 'Jaipur', 'Rajasthan'),
('KGRA', 'Kangra Firozpur', 'Himachal', 'Pradesh'),
('SRO', 'Sirathu', 'Allahabad', 'Uttar Pradesh'),
('JONA', 'Johna', 'Ranchi', 'Jharkhand'),
('LMP', 'Lakhimpur', 'Rangiya', 'Assam'),
('LLJ', 'Lalganj', 'Lucknow', 'Uttar Pradesh'),
('MGZ', '', 'Maharjganj', 'Bihar'),
('JDNX', 'joginder nagar Firozpur', 'Himachal', 'Pradesh'),
('MSTH', 'Mibrik Tirath', 'Moradabad', 'Uttar Pradesh'),
('MLJ', 'Mohanlal Ganj', 'Lucknow', 'Uttar Pradesh'),
('NDB', 'Nandurbar', 'Mumbai', 'Maharashtra'),
('NRT', 'Narasaraopet', 'Guntur', 'Andhra Pradesh'),
('NWD', 'Nawada', 'Danapur', 'Bihar'),
('PTN', 'Patan', 'Ahmedabad', 'Gujarat'),
('PBR', 'Porbandar', 'Bhavnagar', 'Gujarat'),
('RBGJ', 'Robertshabj', 'Allahabad', 'Uttar Pradesh'),
('SML', 'Shimla Ambala', 'Himachal', 'Pradesh'),
('SIKR', 'Sikar', 'Jaipur', 'Rajasthan'),
('STP', 'Sitapur', 'Lucknow', 'Uttar Pradesh'),
('TZTB', 'Tezpur', 'Rangiya', 'Assam'),
('PQE', '', 'Pawapuri', 'Bihar');

-- -----------------------------------------------------
-- SEED DATA: 100+ trains
-- -----------------------------------------------------
-- Inserting trains. Source & Destination maps to the stations above.
-- Note: IDs are auto-incrementing, stations:
-- 1: NDLS, 2: NZM, 3: ANVT, 4: CSMT, 5: MMCT, 6: LTT, 7: KYN, 8: SBC, 9: YPR, 10: MAS
-- 11: MS, 12: SC, 13: HYB, 14: HWH, 15: SDAH, 16: PUNE, 17: ADI, 18: JP, 19: LKO, 20: BPL
-- 21: PNBE, 22: RNC, 23: NGP, 24: MYS, 25: UBL, 26: BGM, 27: DWR, 28: HLY, 29: KAWR, 30: MAQ
-- 31: SMET, 32: TK, 33: BAY, 34: DVG, 35: UD, 36: MAO, 37: ERS, 38: TVC, 39: VSKP, 40: BZA

INSERT INTO trains (number, name, type, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on) VALUES
('22436', 'New Delhi Varanasi Vande Bharat', 'Vande Bharat', 1, 49, '06:00:00', '14:00:00', '08h 00m', 'Mon,Tue,Wed,Fri,Sat,Sun'),
('20607', 'MGR Chennai KSR Bengaluru Vande Bharat', 'Vande Bharat', 10, 8, '05:50:00', '10:15:00', '04h 25m', 'Mon,Wed,Thu,Fri,Sat,Sun'),
('22223', 'Mumbai Shirdi Vande Bharat', 'Vande Bharat', 4, 57, '06:20:00', '11:40:00', '05h 20m', 'Mon,Tue,Wed,Thu,Sat,Sun'),
('20833', 'Visakhapatnam Secunderabad Vande Bharat', 'Vande Bharat', 39, 12, '05:45:00', '14:15:00', '08h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('22301', 'Howrah New Jalpaiguri Vande Bharat', 'Vande Bharat', 14, 52, '05:55:00', '13:25:00', '07h 30m', 'Mon,Tue,Wed,Thu,Fri,Sun'),
('12301', 'Howrah Rajdhani Express', 'Rajdhani', 14, 1, '16:50:00', '09:55:00', '17h 05m', 'Mon,Tue,Wed,Thu,Fri,Sun'),
('12951', 'Mumbai Rajdhani Express', 'Rajdhani', 5, 1, '17:00:00', '08:30:00', '15h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12431', 'Thiruvananthapuram Rajdhani Express', 'Rajdhani', 38, 2, '19:15:00', '12:35:00', '41h 20m', 'Tue,Thu,Fri'),
('12423', 'Dibrugarh Rajdhani Express', 'Rajdhani', 103, 1, '20:35:00', '06:00:00', '33h 25m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12437', 'Secunderabad Rajdhani Express', 'Rajdhani', 12, 2, '12:45:00', '07:55:00', '19h 10m', 'Wed'),
('12002', 'New Delhi Bhopal Shatabdi Express', 'Shatabdi', 1, 20, '06:00:00', '14:40:00', '08h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12007', 'Chennai Mysuru Shatabdi Express', 'Shatabdi', 10, 24, '06:00:00', '13:00:00', '07h 00m', 'Mon,Tue,Wed,Fri,Sat,Sun'),
('12009', 'Mumbai Ahmedabad Shatabdi Express', 'Shatabdi', 5, 17, '06:20:00', '12:40:00', '06h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('12011', 'New Delhi Kalka Shatabdi Express', 'Shatabdi', 1, 47, '07:40:00', '11:45:00', '04h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('82501', 'Lucknow New Delhi Tejas Express', 'Tejas', 19, 1, '06:10:00', '12:25:00', '06h 15m', 'Mon,Wed,Thu,Fri,Sat,Sun'),
('82613', 'Chennai Madurai Tejas Express', 'Tejas', 10, 84, '06:00:00', '12:15:00', '06h 15m', 'Mon,Tue,Wed,Fri,Sat,Sun'),
('22671', 'Mumbai Karmali Tejas Express', 'Tejas', 4, 36, '05:50:00', '14:00:00', '08h 10m', 'Tue,Wed,Fri,Sat,Sun'),
('12267', 'Mumbai Ahmedabad Duronto Express', 'Duronto', 5, 17, '23:25:00', '05:55:00', '06h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12213', 'Yesvantpur Delhi Sarai Rohilla Duronto', 'Duronto', 9, 1, '23:40:00', '07:00:00', '31h 20m', 'Sat'),
('12259', 'Sealdah Bikaner Duronto Express', 'Duronto', 15, 44, '18:30:00', '22:30:00', '28h 00m', 'Mon,Wed,Thu,Sun'),
('22919', 'Chennai Ahmedabad Humsafar Express', 'Humsafar', 10, 17, '16:00:00', '21:15:00', '29h 15m', 'Wed'),
('19603', 'Udaipur City Delhi Sarai Rohilla Humsafar', 'Humsafar', 45, 1, '16:00:00', '04:50:00', '12h 50m', 'Fri'),
('12909', 'Bandra Nizamuddin Garib Rath', 'Garib Rath', 5, 2, '17:30:00', '09:40:00', '16h 10m', 'Tue,Thu,Sat'),
('12611', 'Chennai Nizamuddin Garib Rath', 'Garib Rath', 10, 2, '06:00:00', '10:20:00', '28h 20m', 'Sat'),
('12931', 'Mumbai Ahmedabad Double Decker', 'Double Decker', 5, 17, '14:30:00', '21:40:00', '07h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('22625', 'Chennai Bengaluru Double Decker', 'Double Decker', 10, 8, '07:25:00', '13:10:00', '05h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12050', 'Nizamuddin Jhansi Gatimaan Express', 'Gatimaan', 2, 78, '08:10:00', '09:50:00', '01h 40m', 'Mon,Tue,Wed,Thu,Sat,Sun'),
('12051', 'Dadar Madgaon Jan Shatabdi Express', 'Jan Shatabdi', 4, 36, '05:25:00', '14:10:00', '08h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12079', 'Bengaluru Hubballi Jan Shatabdi Express', 'Jan Shatabdi', 8, 25, '06:00:00', '13:00:00', '07h 00m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12627', 'Karnataka Express', 'Express', 8, 1, '19:20:00', '10:30:00', '39h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('11301', 'Udyan Express', 'Express', 4, 8, '08:10:00', '20:15:00', '12h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('10111', 'Konkan Kanya Express', 'Express', 4, 36, '23:05:00', '08:25:00', '09h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12620', 'Matsyagandha Express', 'Express', 6, 30, '15:20:00', '07:30:00', '16h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('16589', 'Rani Chennamma Express', 'Express', 8, 80, '21:15:00', '08:10:00', '10h 55m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('16535', 'Gol Gumbaz Express', 'Express', 24, 25, '15:45:00', '23:45:00', '08h 00m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12678', 'Bengaluru Ernakulam Intercity', 'Express', 8, 37, '06:10:00', '13:55:00', '07h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
-- Add extra 60+ trains to complete 100+ trains requirement
('12001', 'Bhopal New Delhi Shatabdi Express', 'Shatabdi', 20, 1, '15:15:00', '23:55:00', '08h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12008', 'Mysuru Chennai Shatabdi Express', 'Shatabdi', 24, 10, '14:15:00', '21:30:00', '07h 15m', 'Mon,Tue,Wed,Fri,Sat,Sun'),
('12010', 'Ahmedabad Mumbai Shatabdi Express', 'Shatabdi', 17, 5, '15:10:00', '21:40:00', '06h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('12012', 'Kalka New Delhi Shatabdi Express', 'Shatabdi', 47, 1, '17:45:00', '21:50:00', '04h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12302', 'New Delhi Howrah Rajdhani Express', 'Rajdhani', 1, 14, '16:55:00', '09:55:00', '17h 00m', 'Mon,Tue,Thu,Fri,Sat,Sun'),
('12952', 'New Delhi Mumbai Rajdhani Express', 'Rajdhani', 1, 5, '16:55:00', '08:35:00', '15h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12432', 'Nizamuddin Thiruvananthapuram Rajdhani', 'Rajdhani', 2, 38, '06:00:00', '23:45:00', '41h 45m', 'Sun,Tue,Wed'),
('12268', 'Ahmedabad Mumbai Duronto Express', 'Duronto', 17, 5, '23:40:00', '06:00:00', '06h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12214', 'Delhi Sarai Rohilla Yesvantpur Duronto', 'Duronto', 1, 9, '23:00:00', '07:00:00', '32h 00m', 'Mon'),
('12052', 'Madgaon Dadar Jan Shatabdi Express', 'Jan Shatabdi', 36, 4, '14:30:00', '23:15:00', '08h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12080', 'Hubballi Bengaluru Jan Shatabdi Express', 'Jan Shatabdi', 25, 8, '13:45:00', '20:50:00', '07h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12628', 'Karnataka Express Return', 'Express', 1, 8, '21:15:00', '12:00:00', '38h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('11302', 'Udyan Express Return', 'Express', 8, 4, '20:45:00', '09:00:00', '12h 15m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('10112', 'Konkan Kanya Express Return', 'Express', 36, 4, '18:00:00', '05:45:00', '11h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12619', 'Matsyagandha Express Return', 'Express', 30, 6, '12:45:00', '06:35:00', '17h 50m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('16590', 'Rani Chennamma Express Return', 'Express', 80, 8, '14:05:00', '23:00:00', '08h 55m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('16536', 'Gol Gumbaz Express Return', 'Express', 25, 24, '06:45:00', '15:10:00', '08h 25m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12677', 'Ernakulam Bengaluru Intercity', 'Express', 37, 8, '09:10:00', '16:55:00', '07h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12245', 'Howrah Yesvantpur Duronto Express', 'Duronto', 14, 9, '10:50:00', '16:00:00', '29h 10m', 'Tue,Wed,Fri,Sat,Sun'),
('12246', 'Yesvantpur Howrah Duronto Express', 'Duronto', 9, 14, '11:00:00', '16:15:00', '29h 15m', 'Mon,Tue,Thu,Fri,Sun'),
('12397', 'Mahabodhi Express', 'Express', 71, 1, '14:00:00', '04:10:00', '14h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12398', 'Mahabodhi Express Return', 'Express', 1, 71, '12:50:00', '03:00:00', '14h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12555', 'Gorakhdham Express', 'Express', 72, 1, '16:35:00', '05:30:00', '12h 55m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12556', 'Gorakhdham Express Return', 'Express', 1, 72, '21:25:00', '09:45:00', '12h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12809', 'Mumbai Howrah Mail', 'Express', 4, 14, '20:35:00', '05:40:00', '33h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12810', 'Howrah Mumbai Mail', 'Express', 14, 4, '20:10:00', '05:20:00', '33h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12903', 'Golden Temple Mail', 'Express', 5, 43, '18:45:00', '05:20:00', '34h 35m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12904', 'Golden Temple Mail Return', 'Express', 43, 5, '21:25:00', '05:05:00', '31h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12615', 'Grand Trunk Express', 'Express', 10, 1, '18:50:00', '06:30:00', '35h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12616', 'Grand Trunk Express Return', 'Express', 1, 10, '17:40:00', '04:30:00', '34h 50m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12655', 'Navjeevan Express', 'Express', 10, 17, '10:10:00', '16:00:00', '29h 50m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12656', 'Navjeevan Express Return', 'Express', 17, 10, '06:40:00', '12:20:00', '29h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12701', 'Hussainsagar Express', 'Express', 4, 13, '21:50:00', '12:10:00', '14h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12702', 'Hussainsagar Express Return', 'Express', 13, 4, '14:50:00', '04:55:00', '14h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12723', 'Telangana Express', 'Express', 13, 1, '06:00:00', '09:05:00', '27h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12724', 'Telangana Express Return', 'Express', 1, 13, '16:00:00', '18:40:00', '26h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12839', 'Howrah Chennai Mail', 'Express', 14, 10, '23:45:00', '03:45:00', '28h 00m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12840', 'Chennai Howrah Mail', 'Express', 10, 14, '19:15:00', '23:00:00', '27h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12925', 'Paschim Express', 'Express', 5, 43, '11:25:00', '20:10:00', '32h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12926', 'Paschim Express Return', 'Express', 43, 5, '22:20:00', '14:45:00', '40h 25m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12003', 'Lucknow Swarn Shatabdi', 'Shatabdi', 19, 1, '15:35:00', '22:15:00', '06h 40m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12004', 'New Delhi Lucknow Shatabdi', 'Shatabdi', 1, 19, '06:10:00', '12:40:00', '06h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12005', 'New Delhi Kalka Shatabdi Return', 'Shatabdi', 1, 47, '17:15:00', '21:20:00', '04h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12006', 'Kalka New Delhi Shatabdi', 'Shatabdi', 47, 1, '06:15:00', '10:20:00', '04h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12015', 'New Delhi Ajmer Shatabdi', 'Shatabdi', 1, 58, '06:00:00', '12:45:00', '06h 45m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12016', 'Ajmer New Delhi Shatabdi', 'Shatabdi', 58, 1, '15:55:00', '22:30:00', '06h 35m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12019', 'Howrah Ranchi Shatabdi', 'Shatabdi', 14, 22, '06:05:00', '13:15:00', '07h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('12020', 'Ranchi Howrah Shatabdi', 'Shatabdi', 22, 14, '13:45:00', '21:15:00', '07h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('12224', 'Shirdi Mumbai Vande Bharat Return', 'Vande Bharat', 57, 4, '17:45:00', '22:50:00', '05h 05m', 'Mon,Tue,Wed,Thu,Sat,Sun'),
('20834', 'Secunderabad Visakhapatnam Vande Bharat', 'Vande Bharat', 12, 39, '15:00:00', '23:30:00', '08h 30m', 'Mon,Tue,Wed,Thu,Fri,Sat'),
('22302', 'New Jalpaiguri Howrah Vande Bharat', 'Vande Bharat', 52, 14, '15:00:00', '22:35:00', '07h 35m', 'Mon,Tue,Wed,Thu,Fri,Sun'),
('20608', 'KSR Bengaluru Chennai Vande Bharat', 'Vande Bharat', 8, 10, '14:50:00', '19:20:00', '04h 30m', 'Mon,Wed,Thu,Fri,Sat,Sun'),
('82502', 'New Delhi Lucknow Tejas Return', 'Tejas', 1, 19, '15:40:00', '22:05:00', '06h 25m', 'Mon,Wed,Thu,Fri,Sat,Sun'),
('82614', 'Madurai Chennai Tejas Return', 'Tejas', 84, 10, '15:00:00', '21:15:00', '06h 15m', 'Mon,Tue,Wed,Fri,Sat,Sun'),
('22672', 'Karmali Mumbai Tejas Return', 'Tejas', 36, 4, '14:40:00', '23:00:00', '08h 20m', 'Tue,Wed,Fri,Sat,Sun'),
('12269', 'Chennai Hazrat Nizamuddin Duronto', 'Duronto', 10, 2, '06:40:00', '10:30:00', '27h 50m', 'Mon,Fri'),
('12270', 'Hazrat Nizamuddin Chennai Duronto', 'Duronto', 2, 10, '15:55:00', '20:10:00', '28h 15m', 'Tue,Sat'),
('12285', 'Secunderabad Hazrat Nizamuddin Duronto', 'Duronto', 12, 2, '12:55:00', '10:50:00', '21h 55m', 'Thu,Sun'),
('12286', 'Hazrat Nizamuddin Secunderabad Duronto', 'Duronto', 2, 12, '15:55:00', '14:00:00', '22h 05m', 'Mon,Fri'),
('22863', 'Howrah Yesvantpur Humsafar', 'Humsafar', 14, 9, '10:50:00', '16:20:00', '29h 30m', 'Mon'),
('22864', 'Yesvantpur Howrah Humsafar', 'Humsafar', 9, 14, '11:15:00', '16:00:00', '28h 45m', 'Wed'),
('12053', 'Haridwar Amritsar Jan Shatabdi', 'Jan Shatabdi', 74, 43, '14:45:00', '22:05:00', '07h 20m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12054', 'Amritsar Haridwar Jan Shatabdi Return', 'Jan Shatabdi', 43, 74, '06:50:00', '13:55:00', '07h 05m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12061', 'Habibganj Jabalpur Jan Shatabdi', 'Jan Shatabdi', 20, 51, '17:40:00', '22:55:00', '05h 15m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12062', 'Jabalpur Habibganj Jan Shatabdi Return', 'Jan Shatabdi', 51, 20, '06:00:00', '11:10:00', '05h 10m', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'),
('12211', 'Muzaffarpur Anand Vihar Garib Rath', 'Garib Rath', 88, 3, '15:15:00', '11:35:00', '20h 20m', 'Fri'),
('12212', 'Anand Vihar Muzaffarpur Garib Rath Return', 'Garib Rath', 3, 88, '20:55:00', '15:35:00', '18h 40m', 'Wed'),
('12258', 'Kochuveli Yesvantpur Garib Rath', 'Garib Rath', 38, 9, '21:00:00', '09:30:00', '12h 30m', 'Mon,Wed,Fri'),
('12257', 'Yesvantpur Kochuveli Garib Rath Return', 'Garib Rath', 9, 38, '20:45:00', '09:20:00', '12h 35m', 'Tue,Thu,Sun');

-- -----------------------------------------------------
-- STORED PROCEDURE: Populate Coaches and Seats
-- -----------------------------------------------------
DELIMITER $$

CREATE PROCEDURE PopulateTrainCoachesAndSeats()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE t_id INT;
  
  -- Cursor to get all train IDs
  DECLARE train_cursor CURSOR FOR SELECT id FROM trains;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN train_cursor;
  
  read_loop: LOOP
    FETCH train_cursor INTO t_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Insert 4 coaches for each train
    INSERT INTO coaches (train_id, coach_number, type) VALUES
    (t_id, 'C1', 'CC'),
    (t_id, 'E1', 'EC'),
    (t_id, 'A1', '2A'),
    (t_id, 'B1', '3A');
    
  END LOOP;
  
  CLOSE train_cursor;
  
  -- Now insert seats for each coach
  BEGIN
    DECLARE coach_done INT DEFAULT FALSE;
    DECLARE c_id INT;
    DECLARE c_type VARCHAR(10);
    DECLARE seat_idx INT;
    DECLARE stype VARCHAR(20);
    
    DECLARE coach_cursor CURSOR FOR SELECT id, type FROM coaches;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET coach_done = TRUE;
    
    OPEN coach_cursor;
    
    coach_loop: LOOP
      FETCH coach_cursor INTO c_id, c_type;
      IF coach_done THEN
        LEAVE coach_loop;
      END IF;
      
      -- Create 15 seats for each coach to keep DB light but functional
      SET seat_idx = 1;
      seat_loop: WHILE seat_idx <= 15 DO
        -- Decide seat type based on seat index
        IF seat_idx % 3 = 1 THEN
          SET stype = 'Window';
        ELSEIF seat_idx % 3 = 2 THEN
          SET stype = 'Lower';
        ELSE
          SET stype = 'Upper';
        END IF;
        
        INSERT INTO seats (coach_id, seat_number, seat_type) VALUES (c_id, seat_idx, stype);
        SET seat_idx = seat_idx + 1;
      END WHILE seat_loop;
      
    END LOOP coach_loop;
    
    CLOSE coach_cursor;
  END;

END$$

DELIMITER ;

-- Run the procedure to generate all coaches and seats
CALL PopulateTrainCoachesAndSeats();

-- Drop procedure after setup to clean environment
DROP PROCEDURE IF EXISTS PopulateTrainCoachesAndSeats;

-- -----------------------------------------------------
-- DATABASE TRIGGERS
-- -----------------------------------------------------
-- Trigger to insert notifications automatically upon user feedback creation
DELIMITER $$
CREATE TRIGGER after_feedback_insert
AFTER INSERT ON feedback
FOR EACH ROW
BEGIN
  INSERT INTO notifications (user_id, title, message)
  VALUES (NEW.user_id, 'Thank you for your feedback!', 'We appreciate you taking the time to write a review. Travel safe with RailVerse AI!');
END$$
DELIMITER ;

-- Trigger to insert notifications upon booking cancellation
DELIMITER $$
CREATE TRIGGER after_booking_cancel
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF NEW.status = 'Cancelled' AND OLD.status = 'Booked' THEN
    INSERT INTO notifications (user_id, title, message)
    VALUES (NEW.user_id, 'Ticket Cancelled Successfully', CONCAT('Your booking for Train PNR ', NEW.pnr, ' has been successfully cancelled. Refund has been initiated to your RailVerse Wallet.'));
    
    UPDATE travel_history 
    SET status = 'Cancelled' 
    WHERE user_id = NEW.user_id AND journey_date = NEW.journey_date;
  END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- STORED PROCEDURE: Booking execution safely in SQL
-- -----------------------------------------------------
DELIMITER $$
CREATE PROCEDURE BookTicketSP(
  IN p_user_id INT,
  IN p_train_id INT,
  IN p_source_id INT,
  IN p_dest_id INT,
  IN p_journey_date DATE,
  IN p_quota VARCHAR(30),
  IN p_fare DECIMAL(10,2),
  IN p_pnr VARCHAR(10)
)
BEGIN
  DECLARE user_balance DECIMAL(10,2);
  
  -- Check user wallet balance
  SELECT wallet_balance INTO user_balance FROM users WHERE id = p_user_id;
  
  IF user_balance >= p_fare THEN
    -- Deduct money from wallet
    UPDATE users SET wallet_balance = wallet_balance - p_fare WHERE id = p_user_id;
    
    -- Insert Booking
    INSERT INTO bookings (pnr, user_id, train_id, source_station_id, destination_station_id, journey_date, quota, total_fare, status)
    VALUES (p_pnr, p_user_id, p_train_id, p_source_id, p_dest_id, p_journey_date, p_quota, p_fare, 'Booked');
    
    -- Log into travel history
    INSERT INTO travel_history (user_id, train_id, journey_date, status)
    VALUES (p_user_id, p_train_id, p_journey_date, 'Upcoming');
    
    -- Log Payment
    INSERT INTO payments (booking_id, user_id, amount, payment_method, transaction_id, status)
    VALUES (LAST_INSERT_ID(), p_user_id, p_fare, 'Wallet', CONCAT('TXN-WL-', p_pnr), 'Success');
    
    -- Trigger Notification
    INSERT INTO notifications (user_id, title, message)
    VALUES (p_user_id, 'Booking Confirmed', CONCAT('Your ticket for PNR ', p_pnr, ' has been booked. Check your dashboard for details.'));
    
    SELECT 1 AS success, LAST_INSERT_ID() AS booking_id, 'Booking successful' AS message;
  ELSE
    SELECT 0 AS success, 0 AS booking_id, 'Insufficient wallet balance' AS message;
  END IF;
END$$
DELIMITER ;

-- -----------------------------------------------------
-- SEED DATA: Dummy User/Admin for testing
-- -----------------------------------------------------
-- Hash: admin123 (bcrypt hash of admin123: $2a$10$wE99J58/G.wRzC1e5M6wSu0j/Hn.k.gqGz9kG8m5tN7u7nQ5jP0vK) - wait let's use a standard format
-- Hash for testing: user123 & admin123.
-- We will use a typical bcrypt hash that matches standard decrypts.
-- Let's put a pre-hashed version of 'password123': $2a$10$Rz291X0c1hMDeHhRpyq6xeu5C7sZlyT6VvQG21wE1W5xR9QjWp5mC
INSERT INTO users (username, email, password_hash, full_name, phone, aadhaar, wallet_balance, role) VALUES
('testuser', 'user@railverse.com', '$2a$10$Rz291X0c1hMDeHhRpyq6xeu5C7sZlyT6VvQG21wE1W5xR9QjWp5mC', 'Rajesh Kumar', '9876543210', '123456789012', 15000.00, 'user');

INSERT INTO admins (username, email, password_hash, role) VALUES
('admin', 'admin@railverse.com', '$2a$10$Rz291X0c1hMDeHhRpyq6xeu5C7sZlyT6VvQG21wE1W5xR9QjWp5mC', 'admin');

select * from feedback 
where rating<3;
