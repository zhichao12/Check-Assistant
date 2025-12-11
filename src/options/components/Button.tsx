import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary-600 text-white
    hover:bg-primary-700
    focus-visible:ring-primary-500
    disabled:bg-primary-400
  `,
  secondary: `
    bg-gray-100 text-gray-700
    hover:bg-gray-200
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600
    focus-visible:ring-gray-400
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100
    dark:text-gray-300
    dark:hover:bg-gray-800
    focus-visible:ring-gray-400
  `,
  danger: `
    bg-red-50 text-red-600 border border-red-200
    hover:bg-red-100
    dark:bg-red-900/20 dark:text-red-400 dark:border-red-800
    dark:hover:bg-red-900/30
    focus-visible:ring-red-500
  `,
  warning: `
    bg-amber-50 text-amber-600 border border-amber-200
    hover:bg-amber-100
    dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800
    dark:hover:bg-amber-900/30
    focus-visible:ring-amber-500
  `,
  outline: `
    bg-transparent border border-dashed border-primary-300 text-primary-600
    hover:bg-primary-50 hover:border-primary-400
    dark:border-primary-700 dark:text-primary-400
    dark:hover:bg-primary-900/20 dark:hover:border-primary-600
    focus-visible:ring-primary-500
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    className = '',
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-gray-800
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <LoadingSpinner className="w-4 h-4" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});

function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Icon Button variant for action buttons
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'danger';
  size?: 'sm' | 'md';
  label: string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', label, className = '', children, ...props },
  ref
) {
  const iconVariantStyles = {
    ghost: `
      text-gray-400 hover:text-gray-600
      hover:bg-gray-100
      dark:hover:text-gray-300 dark:hover:bg-gray-800
    `,
    danger: `
      text-gray-400 hover:text-red-500
      hover:bg-red-50
      dark:hover:text-red-400 dark:hover:bg-red-900/20
    `,
  };

  const iconSizeStyles = {
    sm: 'p-1',
    md: 'p-1.5',
  };

  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`
        rounded-md transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
        ${iconVariantStyles[variant]}
        ${iconSizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});
