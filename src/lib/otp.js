import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { connectDB } from '@/lib/db';
import { sendOtpSms } from '@/lib/sms';
import Otp from '@/models/Otp';

const minute = 60 * 1000;

function hashCode(phone, purpose, code) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(`${phone}:${purpose}:${code}`).digest('hex');
}

export async function issueOtp(phone, purpose) {
  await connectDB();

  const last = await Otp.findOne({ phone, purpose }).sort({ createdAt: -1 }).lean();
  if (last && Date.now() - last.createdAt.getTime() < minute) return { error: 'otpWait' };

  const lastHour = await Otp.countDocuments({ phone, purpose, createdAt: { $gt: new Date(Date.now() - 60 * minute) } });
  if (lastHour >= 5) return { error: 'otpLimit' };

  const code = String(randomInt(0, 1000000)).padStart(6, '0');
  await Otp.create({ phone, purpose, codeHash: hashCode(phone, purpose, code), expiresAt: new Date(Date.now() + 10 * minute) });

  const sent = await sendOtpSms(phone, code);
  return sent ? { ok: true } : { error: 'otpSend' };
}

export async function checkOtp(phone, purpose, code) {
  await connectDB();

  const otp = await Otp.findOne({ phone, purpose, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!otp || otp.attempts >= 5) return false;

  const given = Buffer.from(hashCode(phone, purpose, String(code || '').trim()));
  if (!timingSafeEqual(given, Buffer.from(otp.codeHash))) {
    otp.attempts += 1;
    await otp.save();
    return false;
  }

  await Otp.deleteMany({ phone, purpose });
  return true;
}
