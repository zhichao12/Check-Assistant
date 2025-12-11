import { useEffect, useState, useCallback } from 'react';
import type { Message, MessageResponse } from '@/shared/types';
import {
  type ReminderSettings,
  type ReminderTime,
  type ThemePreference,
  DEFAULT_REMINDER_SETTINGS,
} from '@/lib/storage';
import { generateId } from '@/shared/utils';

// ============================================================================
// Messaging Utilities
// ============================================================================

/**
 * Send message to background script
 */
async function sendMessage<T>(message: Message): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onToggle, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ============================================================================
// Section Card Component
// ============================================================================

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ============================================================================
// Setting Row Component
// ============================================================================

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ============================================================================
// Reminder Time Editor Component
// ============================================================================

interface ReminderTimeEditorProps {
  time: ReminderTime;
  onChange: (time: ReminderTime) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: '日', shortLabel: 'S' },
  { value: 1, label: '一', shortLabel: 'M' },
  { value: 2, label: '二', shortLabel: 'T' },
  { value: 3, label: '三', shortLabel: 'W' },
  { value: 4, label: '四', shortLabel: 'T' },
  { value: 5, label: '五', shortLabel: 'F' },
  { value: 6, label: '六', shortLabel: 'S' },
] as const;

function ReminderTimeEditor({ time, onChange, onRemove, canRemove }: ReminderTimeEditorProps) {
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
      className={`p-4 rounded-lg border ${time.enabled ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <ToggleSwitch enabled={time.enabled} onToggle={handleEnabledToggle} />
        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          disabled={!time.enabled}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="删除此提醒时间"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {DAYS_OF_WEEK.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => time.enabled && handleDayToggle(value)}
            disabled={!time.enabled}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              !time.enabled
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : time.days.includes(value as ReminderTime['days'][0])
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
            title={label}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Confirmation Dialog Component
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Options Page Component
// ============================================================================

export default function App() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteCount, setSiteCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'clear' | 'reset' | null;
  }>({ type: null });

  // Load settings and site count on mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply theme on settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [settingsResponse, sitesResponse] = await Promise.all([
        sendMessage<ReminderSettings>({ type: 'GET_SETTINGS' }),
        sendMessage<unknown[]>({ type: 'GET_SITES' }),
      ]);

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      }

      if (sitesResponse.success && sitesResponse.data) {
        setSiteCount(sitesResponse.data.length);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('加载设置失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }

  function applyTheme(theme: ThemePreference) {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await sendMessage<ReminderSettings>({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });

      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('保存设置失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  // Theme handlers
  const handleThemeChange = (theme: ThemePreference) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  // Reminder handlers
  const handleReminderToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enabled }));
  };

  const handleSoundToggle = (sound: boolean) => {
    setSettings((prev) => ({ ...prev, sound }));
  };

  const handleReminderTimeChange = (index: number, time: ReminderTime) => {
    setSettings((prev) => ({
      ...prev,
      times: prev.times.map((t, i) => (i === index ? time : t)),
    }));
  };

  const handleAddReminderTime = () => {
    const newTime: ReminderTime = {
      id: generateId(),
      hour: 12,
      minute: 0,
      days: [1, 2, 3, 4, 5],
      enabled: true,
    };
    setSettings((prev) => ({
      ...prev,
      times: [...prev.times, newTime],
    }));
  };

  const handleRemoveReminderTime = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const handleSnoozeChange = (minutes: number) => {
    setSettings((prev) => ({ ...prev, snoozeMinutes: minutes }));
  };

  // Auto-detect handlers
  const handleAutoMarkToggle = (autoMarkOnVisit: boolean) => {
    setSettings((prev) => ({ ...prev, autoMarkOnVisit }));
  };

  // Badge handlers
  const handleBadgeToggle = (showBadge: boolean) => {
    setSettings((prev) => ({ ...prev, showBadge }));
  };

  // Reset time handler
  const handleResetTimeChange = (hour: number) => {
    setSettings((prev) => ({ ...prev, resetTime: hour }));
  };

  // Bulk actions
  const handleClearAllSites = async () => {
    try {
      const response = await sendMessage({ type: 'CLEAR_ALL_SITES' });
      if (response.success) {
        setSiteCount(0);
        setConfirmDialog({ type: null });
      } else {
        setError(response.error || '清除失败');
      }
    } catch (err) {
      console.error('Failed to clear sites:', err);
      setError('清除网站失败，请重试');
    }
  };

  const handleResetAllStatus = async () => {
    try {
      const response = await sendMessage({ type: 'RESET_ALL_STATUS' });
      if (response.success) {
        setConfirmDialog({ type: null });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(response.error || '重置失败');
      }
    } catch (err) {
      console.error('Failed to reset status:', err);
      setError('重置状态失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">签到助手设置</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">自定义您的签到提醒和偏好设置</p>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <SectionCard title="外观" description="自定义应用外观">
            <SettingRow label="主题" description="选择浅色、深色或跟随系统设置">
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      settings.theme === theme
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '系统'}
                  </button>
                ))}
              </div>
            </SettingRow>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <SettingRow label="显示角标" description="在扩展图标上显示待签到数量">
              <ToggleSwitch enabled={settings.showBadge} onToggle={handleBadgeToggle} />
            </SettingRow>
          </SectionCard>

          {/* Reminder Settings */}
          <SectionCard title="提醒设置" description="配置签到提醒时间和通知">
            <SettingRow label="启用提醒" description="在指定时间发送签到提醒通知">
              <ToggleSwitch enabled={settings.enabled} onToggle={handleReminderToggle} />
            </SettingRow>

            {settings.enabled && (
              <>
                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    提醒时间
                  </label>

                  <div className="space-y-3">
                    {settings.times.map((time, index) => (
                      <ReminderTimeEditor
                        key={time.id}
                        time={time}
                        onChange={(t) => handleReminderTimeChange(index, t)}
                        onRemove={() => handleRemoveReminderTime(index)}
                        canRemove={settings.times.length > 1}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleAddReminderTime}
                    className="w-full py-2 px-4 text-sm font-medium text-primary-600 dark:text-primary-400 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    + 添加提醒时间
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-4" />

                <SettingRow label="通知声音" description="提醒时播放通知声音">
                  <ToggleSwitch enabled={settings.sound} onToggle={handleSoundToggle} />
                </SettingRow>

                <SettingRow label="稍后提醒" description={'点击"稍后提醒"后的延迟时间'}>
                  <select
                    value={settings.snoozeMinutes}
                    onChange={(e) => handleSnoozeChange(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value={15}>15 分钟</option>
                    <option value={30}>30 分钟</option>
                    <option value={60}>1 小时</option>
                    <option value={120}>2 小时</option>
                  </select>
                </SettingRow>
              </>
            )}
          </SectionCard>

          {/* Auto-detect Settings */}
          <SectionCard title="自动检测" description="配置自动访问检测行为">
            <SettingRow
              label="自动标记访问"
              description="访问已保存网站时自动标记为已访问（需网站开启自动检测）"
            >
              <ToggleSwitch enabled={settings.autoMarkOnVisit} onToggle={handleAutoMarkToggle} />
            </SettingRow>
          </SectionCard>

          {/* Daily Reset Settings */}
          <SectionCard title="每日重置" description="配置每日状态重置时间">
            <SettingRow label="重置时间" description="每日重置签到状态的时间（24小时制）">
              <select
                value={settings.resetTime}
                onChange={(e) => handleResetTimeChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </SettingRow>
          </SectionCard>

          {/* Data Management */}
          <SectionCard title="数据管理" description="管理保存的网站数据">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    已保存网站
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    共 {siteCount} 个网站
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setConfirmDialog({ type: 'reset' })}
                  disabled={siteCount === 0}
                  className="flex-1 py-2 px-4 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  重置今日状态
                </button>
                <button
                  onClick={() => setConfirmDialog({ type: 'clear' })}
                  disabled={siteCount === 0}
                  className="flex-1 py-2 px-4 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  清除所有网站
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4">
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                已保存
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  保存中...
                </>
              ) : (
                '保存设置'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">签到助手 v0.1.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Never miss a daily check-in again!
          </p>
        </footer>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.type === 'clear'}
        title="清除所有网站？"
        message={`确定要删除所有 ${siteCount} 个已保存的网站吗？此操作不可撤销。`}
        confirmText="确认清除"
        onConfirm={handleClearAllSites}
        onCancel={() => setConfirmDialog({ type: null })}
        danger
      />

      <ConfirmDialog
        isOpen={confirmDialog.type === 'reset'}
        title="重置今日状态？"
        message={'确定要重置所有网站的今日签到状态吗？这将清除所有"已访问"和"已签到"标记。'}
        confirmText="确认重置"
        onConfirm={handleResetAllStatus}
        onCancel={() => setConfirmDialog({ type: null })}
      />
    </div>
  );
}
