'use client';

import { useActionState } from 'react';
import { createReport } from '@/app/actions/reports';
import { REPORT_REASONS } from '@/lib/constants';
import styles from './ReportForm.module.css';

function ReportForm({ listingId, t }) {
  const [state, formAction, isPending] = useActionState(createReport, { sent: false });

  if (state.sent) return <p className={styles.thanks}>{t.report.thanks}</p>;

  return (
    <details className={styles.report}>
      <summary>{t.report.open}</summary>
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="listingId" value={listingId} />
        <fieldset>
          <legend>{t.report.title}</legend>
          {REPORT_REASONS.map((reason, index) => (
            <label key={reason}>
              <input type="radio" name="reason" value={reason} defaultChecked={index === 0} />
              {t.reasons[reason]}
            </label>
          ))}
        </fieldset>
        <label className={styles.note}>
          {t.report.note}
          <textarea name="note" maxLength={300} />
        </label>
        <button type="submit" disabled={isPending}>
          {isPending ? t.report.sending : t.report.send}
        </button>
      </form>
    </details>
  );
}

export default ReportForm;
