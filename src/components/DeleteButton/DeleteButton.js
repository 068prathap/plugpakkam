'use client';

function DeleteButton({ label, confirmText, className }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}

export default DeleteButton;
