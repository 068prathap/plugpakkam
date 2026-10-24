import styles from '@/styles/form.module.css';

function Field({ label, name, error, hint, children, ...props }) {
  return (
    <div className={styles.field}>
      <label htmlFor={name}>{label}</label>
      {children || <input id={name} name={name} aria-invalid={!!error} {...props} />}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export default Field;
