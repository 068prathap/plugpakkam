'use client';

import { useActionState } from 'react';
import { resetPassword, sendResetCode } from '@/app/actions/auth';
import CodeStep from './CodeStep';
import { PasswordField } from './fields';
import Field from '@/components/Field/Field';
import styles from '@/styles/form.module.css';
import authStyles from '@/styles/auth.module.css';

function ResetDetails({ t, phone, admin }) {
  const [state, formAction, isPending] = useActionState(resetPassword, { errors: {} });
  const errors = state.errors || {};

  return (
    <form action={formAction} className={authStyles.form}>
      <input type="hidden" name="phone" value={phone} />
      {admin && <input type="hidden" name="admin" value="1" />}
      <Field label={t.auth.code} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={authStyles.otp} error={errors.code && t.errors[errors.code]} />
      <PasswordField label={t.auth.newPassword} name="password" autoComplete="new-password" error={errors.password && t.errors[errors.password]} />
      <PasswordField label={t.auth.confirmPassword} name="confirm" autoComplete="new-password" error={errors.confirm && t.errors[errors.confirm]} />
      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? t.auth.resetting : t.auth.reset}
      </button>
    </form>
  );
}

function ForgotForm({ t, admin }) {
  return (
    <CodeStep t={t} sendCode={sendResetCode}>
      {(phone) => <ResetDetails t={t} phone={phone} admin={admin} />}
    </CodeStep>
  );
}

export default ForgotForm;
