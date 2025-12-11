import type { ReminderTime } from '@/lib/storage';
import { ToggleSwitch } from './ToggleSwitch';
import { IconButton } from './Button';

export interface ReminderTimeEditorProps {
  time: ReminderTime;
  onChange: (time: ReminderTime) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
] as const;

export function ReminderTimeEditor({
  time,
  onChange,
  onRemove,
  canRemove,
}: ReminderTimeEditorProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    onChange({ ...time, hour: hours, minute: minutes });
  };

  const handleDayToggle = (day: number) => {
    const days = time.days.includes(day as ReminderTime['days'][0])
      ? time.days.filter((d) => d !== day)
      : [...time.days, day as ReminderTime['days'][0]].sort();
    onChange({ ...time, days });
  };

  const handleEnabledToggle = () => {
    onChange({ ...time, enabled: !time.enabled });
  };

  const timeValue = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;

  return (
    <div
      className={`
        p-4 rounded-xl border-2 transition-all duration-200
        ${
          time.enabled
            ? 'border-primary-200 dark:border-primary-800/60 bg-primary-50/50 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
        }
      `}
    >
      {/* Top row: toggle, time input, delete button */}
      <div className="flex items-center gap-3 mb-4">
        <ToggleSwitch
          enabled={time.enabled}
          onToggle={handleEnabledToggle}
          label={time.enabled ? '已启用提醒' : '已禁用提醒'}
        />

        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={!time.enabled}
          className={`
            flex-1 min-w-[100px] max-w-[140px]
            px-3 py-2 text-sm font-medium
            border border-gray-300 dark:border-gray-600
            rounded-lg
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800/50
          `}
        />

        <div className="flex-1" />

        {canRemove && (
          <IconButton
            variant="danger"
            onClick={onRemove}
            label="删除此提醒时间"
          >
            <TrashIcon className="w-4 h-4" />
          </IconButton>
        )}
      </div>

      {/* Day chips */}
      <div className="flex flex-wrap gap-1.5">
        {DAYS_OF_WEEK.map(({ value, label }) => {
          const isSelected = time.days.includes(value as ReminderTime['days'][0]);
          const isDisabled = !time.enabled;

          return (
            <button
              key={value}
              type="button"
              onClick={() => !isDisabled && handleDayToggle(value)}
              disabled={isDisabled}
              className={`
                w-9 h-9 rounded-full text-xs font-semibold
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
                dark:focus-visible:ring-offset-gray-800
                ${
                  isDisabled
                    ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400'
                }
              `}
              title={getDayFullName(value)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getDayFullName(day: number): string {
  const names: Record<number, string> = {
    0: '星期日',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六',
  };
  return names[day] || '';
}

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
