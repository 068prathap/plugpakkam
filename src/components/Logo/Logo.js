function Logo({ height = 30 }) {
  return (
    <svg height={height} viewBox="0 0 44 30" aria-hidden="true">
      <rect width="44" height="30" rx="6" fill="#0b8a45" />
      <rect x="2" y="2" width="40" height="26" rx="4.5" fill="none" stroke="#ffffff" strokeWidth="1.6" />
      <path d="M24.5 6 15 17h6l-2 7.5L28.5 13h-6l2-7Z" fill="#ffffff" />
    </svg>
  );
}

export default Logo;
