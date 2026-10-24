'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';
import { PasswordField, PhoneField } from './fields';
import styles from '@/styles/form.module.css';
import authStyles from '@/styles/auth.module.css';

function LoginForm({ t, next, admin }) {
  const [state, formAction, isPending] = useActionState(login, {});

  return (
    <form action={formAction} className={authStyles.form}>
      <input type="hidden" name="next" value={next || ''} />
      {admin && <input type="hidden" name="admin" value="1" />}
      <PhoneField label={t.auth.phone} defaultValue={state.phone} required />
      <PasswordField label={t.auth.password} name="password" />
      {state.error && <p className={styles.formError}>{t.errors[state.error]}</p>}
      <div className={authStyles.row}>
        <span />
        <Link href={admin ? '/admin/forgot' : '/forgot'} className={styles.link}>
          {t.auth.forgot}
        </Link>
      </div>
      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? t.auth.signingIn : t.auth.signIn}
      </button>
    </form>
  );
}

export default LoginForm;
