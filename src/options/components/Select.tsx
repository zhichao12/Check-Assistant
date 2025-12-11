import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  fullWidth?: boolean;
}

export function Select({ className = '', fullWidth = false, ...props }: SelectProps) {
  return (
    <select
      className={`
        px-3 py-2 text-sm
        border border-gray-300 dark:border-gray-600
        rounded-lg
        bg-white dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    />
  );
}
