'use client';

import { useState, useTransition } from 'react';
import { PhoneField, useCooldown } from './fields';
import styles from '@/styles/form.module.css';
import authStyles from '@/styles/auth.module.css';

function CodeStep({ t, sendCode, children }) {
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [isSending, startSending] = useTransition();
  const [secondsLeft, startCooldown] = useCooldown();

  function send(number) {
    setError('');
    startSending(async () => {
      const result = await sendCode(number);
      if (result.error) {
        setError(t.errors[result.error]);
        return;
      }
      setSentTo(number.replace(/\D/g, '').slice(-10));
      startCooldown();
    });
  }

  if (!sentTo) {
    return (
      <form
        className={authStyles.form}
        onSubmit={(event) => {
          event.preventDefault();
          send(phone);
        }}
      >
        <PhoneField label={t.auth.phone} value={phone} onChange={(event) => setPhone(event.target.value)} error={error} required autoFocus />
        <button type="submit" className={styles.submit} disabled={isSending}>
          {isSending ? t.auth.sending : t.auth.sendCode}
        </button>
      </form>
    );
  }

  return (
    <div className={authStyles.form}>
      <p className={authStyles.sentTo}>
        {t.auth.codeSent} <b>+91 {sentTo}</b>
      </p>
      {error && <p className={styles.formError}>{error}</p>}
      {children(sentTo)}
      <div className={authStyles.row}>
        <button type="button" className={styles.link} onClick={() => setSentTo('')}>
          {t.auth.changeNumber}
        </button>
        <button type="button" className={styles.link} disabled={secondsLeft > 0 || isSending} onClick={() => send(sentTo)}>
          {secondsLeft > 0 ? `${t.auth.resend} (${secondsLeft}s)` : t.auth.resend}
        </button>
      </div>
    </div>
  );
}

export default CodeStep;
