import styles from './FilterChip.module.css';

function FilterChip({ label, anyLabel, value, options, onChange }) {
  const current = options.find((option) => option.value === value);

  return (
    <label className={`${styles.chip} ${current ? styles.on : ''}`}>
      <span>{current ? current.label : label}</span>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        <option value="">{anyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default FilterChip;
