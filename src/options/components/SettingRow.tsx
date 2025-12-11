import type { ReactNode } from 'react';

export interface SettingRowProps {
  label: string;
  description?: string;
  children: ReactNode;
  stacked?: boolean;
}

export function SettingRow({ label, description, children, stacked = false }: SettingRowProps) {
  if (stacked) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-3">
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export interface SettingDividerProps {
  className?: string;
}

export function SettingDivider({ className = '' }: SettingDividerProps) {
  return (
    <div
      className={`border-t border-gray-100 dark:border-gray-700/50 my-1 ${className}`}
      role="separator"
    />
  );
}
