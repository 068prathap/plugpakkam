'use client';

import { useActionState } from 'react';
import { changePassword } from '@/app/actions/auth';
import { PasswordField } from './fields';
import styles from '@/styles/form.module.css';
import authStyles from '@/styles/auth.module.css';

function ChangePasswordForm({ t }) {
  const [state, formAction, isPending] = useActionState(changePassword, { errors: {} });
  const errors = state.errors || {};

  return (
    <form action={formAction} className={authStyles.form}>
      {state.done && <p className={styles.success}>{t.auth.changed}</p>}
      <PasswordField label={t.auth.currentPassword} name="current" error={errors.current && t.errors[errors.current]} />
      <PasswordField label={t.auth.newPassword} name="password" autoComplete="new-password" error={errors.password && t.errors[errors.password]} />
      <PasswordField label={t.auth.confirmPassword} name="confirm" autoComplete="new-password" error={errors.confirm && t.errors[errors.confirm]} />
      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? t.auth.resetting : t.auth.change}
      </button>
    </form>
  );
}

export default ChangePasswordForm;
