/**
 * resetAdmin.js
 * Run with: node resetAdmin.js
 * Creates/resets admin credentials:
 *   username: admin
 *   password: admin123
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

async function resetAdmin() {
  const dbFile = path.join(__dirname, 'database', 'database.sqlite');
  const db = await open({ filename: dbFile, driver: sqlite3.Database });

  const adminUsername = 'admin';
  const adminEmail = 'admin@railverse.com';
  const adminPassword = 'admin123'; // You can change this

  const password_hash = await bcrypt.hash(adminPassword, 10);

  // Check if admin already exists
  const existing = await db.get('SELECT id FROM admins WHERE username = ?', [adminUsername]);

  if (existing) {
    await db.run('UPDATE admins SET password_hash = ? WHERE username = ?', [password_hash, adminUsername]);
    console.log(`✅ Admin password reset successfully!`);
  } else {
    await db.run(
      'INSERT INTO admins (username, email, password_hash, role) VALUES (?, ?, ?, "admin")',
      [adminUsername, adminEmail, password_hash]
    );
    console.log(`✅ Admin account created successfully!`);
  }

  console.log(`\n📋 Admin Credentials:`);
  console.log(`   Username: ${adminUsername}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Email:    ${adminEmail}`);

  await db.close();
}

resetAdmin().catch(console.error);
