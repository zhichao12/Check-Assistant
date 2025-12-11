import type { ReactNode } from 'react';

export interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function SectionCard({ title, description, children, icon }: SectionCardProps) {
  return (
    <section
      className="
        bg-white dark:bg-gray-800
        rounded-xl shadow-sm
        border border-gray-200 dark:border-gray-700
        overflow-hidden
        transition-colors duration-150
      "
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
