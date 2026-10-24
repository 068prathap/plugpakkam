'use client';

import { useState } from 'react';
import styles from '@/styles/form.module.css';

export function PhoneField({ label, error, ...props }) {
  return (
    <div className={styles.field}>
      <label htmlFor="phone">{label}</label>
      <div className={styles.prefixed}>
        <span>+91</span>
        <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} aria-invalid={!!error} {...props} />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function PasswordField({ label, name, error, autoComplete = 'current-password' }) {
  const [shown, setShown] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      <div className={styles.password}>
        <input id={name} name={name} type={shown ? 'text' : 'password'} autoComplete={autoComplete} aria-invalid={!!error} required />
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? 'Hide password' : 'Show password'}>
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function useCooldown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);

  function start() {
    const end = Date.now() + 60000;
    setUntil(end);
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= end) clearInterval(timer);
    }, 1000);
  }

  return [Math.max(0, Math.ceil((until - now) / 1000)), start];
}
