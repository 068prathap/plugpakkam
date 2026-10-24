'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { createSession, deleteSession } from '@/lib/session';
import { getCurrentUser, safeNext } from '@/lib/auth';
import { checkOtp, issueOtp } from '@/lib/otp';
import { cleanPhone, isValidPhone } from '@/lib/format';
import User from '@/models/User';

function readPasswords(formData, errors) {
  const password = formData.get('password') || '';
  if (password.length < 8) errors.password = 'password';
  else if (password !== formData.get('confirm')) errors.confirm = 'passwordMatch';
  return password;
}

export async function login(prevState, formData) {
  const phone = cleanPhone(formData.get('phone'));
  const password = formData.get('password') || '';
  const forAdmin = formData.get('admin') === '1';

  await connectDB();
  const user = await User.findOne({ phone });
  const matches = user && (await bcrypt.compare(password, user.passwordHash));

  if (!matches) return { error: 'wrongLogin', phone };
  if (forAdmin && user.role !== 'admin') return { error: 'notAdmin', phone };

  await createSession(user);
  redirect(forAdmin ? '/admin' : safeNext(formData.get('next')));
}

export async function sendSignupCode(phoneValue) {
  const phone = cleanPhone(phoneValue);
  if (!isValidPhone(phone)) return { error: 'phone' };

  await connectDB();
  if (await User.exists({ phone })) return { error: 'phoneTaken' };

  return issueOtp(phone, 'signup');
}

export async function signup(prevState, formData) {
  const phone = cleanPhone(formData.get('phone'));
  const name = formData.get('name')?.trim() || '';
  const errors = {};

  if (!name || name.length > 60) errors.name = 'personName';
  const password = readPasswords(formData, errors);
  if (Object.keys(errors).length > 0) return { errors, name };

  if (!(await checkOtp(phone, 'signup', formData.get('code')))) return { errors: { code: 'otpWrong' }, name };

  await connectDB();
  if (await User.exists({ phone })) return { errors: { code: 'phoneTaken' }, name };

  const user = await User.create({ name, phone, passwordHash: await bcrypt.hash(password, 10) });
  await createSession(user);
  redirect(safeNext(formData.get('next')));
}

export async function sendResetCode(phoneValue) {
  const phone = cleanPhone(phoneValue);
  if (!isValidPhone(phone)) return { error: 'phone' };

  await connectDB();
  if (!(await User.exists({ phone }))) return { error: 'noAccount' };

  return issueOtp(phone, 'reset');
}

export async function resetPassword(prevState, formData) {
  const phone = cleanPhone(formData.get('phone'));
  const errors = {};
  const password = readPasswords(formData, errors);
  if (Object.keys(errors).length > 0) return { errors };

  if (!(await checkOtp(phone, 'reset', formData.get('code')))) return { errors: { code: 'otpWrong' } };

  await connectDB();
  const user = await User.findOne({ phone });
  if (!user) return { errors: { code: 'noAccount' } };

  user.passwordHash = await bcrypt.hash(password, 10);
  user.sessionVersion += 1;
  await user.save();
  await createSession(user);
  redirect(formData.get('admin') === '1' && user.role === 'admin' ? '/admin' : '/host');
}

export async function changePassword(prevState, formData) {
  const current = await getCurrentUser();
  if (!current) redirect('/login');

  const errors = {};
  const password = readPasswords(formData, errors);
  if (Object.keys(errors).length > 0) return { errors };

  await connectDB();
  const user = await User.findById(current.id);
  if (!(await bcrypt.compare(formData.get('current') || '', user.passwordHash))) {
    return { errors: { current: 'currentPassword' } };
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.sessionVersion += 1;
  await user.save();
  await createSession(user);
  return { done: true };
}

export async function signOut(formData) {
  await deleteSession();
  redirect(formData?.get('admin') === '1' ? '/admin/login' : '/');
}
