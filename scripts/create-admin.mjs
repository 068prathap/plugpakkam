import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const [phoneArg, password, ...nameParts] = process.argv.slice(2);
const phone = String(phoneArg || '').replace(/\D/g, '').slice(-10);
const name = nameParts.join(' ') || 'Admin';

if (!/^[6-9]\d{9}$/.test(phone) || !password || password.length < 8) {
  console.error('Usage: npm run create-admin -- <10 digit phone> <password, 8+ chars> [name]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.db.collection('users');
const now = new Date();

await users.updateOne(
  { phone },
  {
    $set: { role: 'admin', passwordHash: await bcrypt.hash(password, 10), updatedAt: now },
    $setOnInsert: { phone, name, createdAt: now },
    $inc: { sessionVersion: 1 },
  },
  { upsert: true }
);

console.log(`Admin ready: ${phone}. Sign in at /admin/login and change the password.`);
await mongoose.disconnect();
