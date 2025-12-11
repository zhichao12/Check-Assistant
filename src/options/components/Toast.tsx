import { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
}

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const styles = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export function Toast({
  message,
  type = 'success',
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Small delay to trigger animation
      requestAnimationFrame(() => setShow(true));

      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onDismiss?.(), 200);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2
        px-4 py-3 rounded-lg shadow-lg
        border border-gray-200 dark:border-gray-700
        transform transition-all duration-200
        ${styles[type]}
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      role="alert"
    >
      <span className="flex-shrink-0">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
