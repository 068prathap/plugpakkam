'use client';

import { useActionState } from 'react';
import { sendSignupCode, signup } from '@/app/actions/auth';
import CodeStep from './CodeStep';
import { PasswordField } from './fields';
import Field from '@/components/Field/Field';
import styles from '@/styles/form.module.css';
import authStyles from '@/styles/auth.module.css';

function SignupDetails({ t, phone, next }) {
  const [state, formAction, isPending] = useActionState(signup, { errors: {} });
  const errors = state.errors || {};

  return (
    <form action={formAction} className={authStyles.form}>
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="next" value={next || ''} />
      <Field label={t.auth.code} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={authStyles.otp} error={errors.code && t.errors[errors.code]} />
      <Field label={t.auth.name} name="name" autoComplete="name" defaultValue={state.name} maxLength={60} required error={errors.name && t.errors[errors.name]} />
      <PasswordField label={t.auth.password} name="password" autoComplete="new-password" error={errors.password && t.errors[errors.password]} />
      <PasswordField label={t.auth.confirmPassword} name="confirm" autoComplete="new-password" error={errors.confirm && t.errors[errors.confirm]} />
      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? t.auth.creating : t.auth.create}
      </button>
    </form>
  );
}

function SignupForm({ t, next }) {
  return (
    <CodeStep t={t} sendCode={sendSignupCode}>
      {(phone) => <SignupDetails t={t} phone={phone} next={next} />}
    </CodeStep>
  );
}

export default SignupForm;
