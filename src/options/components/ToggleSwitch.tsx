import { useId } from 'react';

export interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function ToggleSwitch({
  enabled,
  onToggle,
  disabled = false,
  label,
}: ToggleSwitchProps) {
  const id = useId();

  return (
    <button
      id={label ? id : undefined}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-gray-800
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-4 w-4 transform rounded-full
          bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}
