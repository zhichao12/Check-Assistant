import { useEffect, useState, useCallback } from 'react';

import type { Message, MessageResponse } from '@/shared/types';
import {
  type ReminderSettings,
  type ReminderTime,
  type ThemePreference,
  DEFAULT_REMINDER_SETTINGS,
} from '@/lib/storage';
import { generateId } from '@/shared/utils';

import {
  ToggleSwitch,
  SectionCard,
  SettingRow,
  SettingDivider,
  Button,
  Select,
  ConfirmDialog,
  ReminderTimeEditor,
  Toast,
} from './components';

// ============================================================================
// Icons
// ============================================================================

function PaletteIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  );
}

function BellIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function EyeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DatabaseIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  );
}

function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

// ============================================================================
// Messaging Utilities
// ============================================================================

async function sendMessage<T>(message: Message): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

// ============================================================================
// Theme Selector Component
// ============================================================================

interface ThemeSelectorProps {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
}

function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const themes: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: '浅色',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: 'dark',
      label: '深色',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
    },
    {
      id: 'system',
      label: '系统',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex gap-2">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            ${
              value === theme.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {theme.icon}
          <span className="hidden sm:inline">{theme.label}</span>
        </button>
      ))}
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [siteCount, setSiteCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'clear' | 'reset' | null }>({
    type: null,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

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
      setToast({ message: '加载设置失败，请刷新页面重试', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings and site count on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply theme on settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

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

    try {
      const response = await sendMessage<ReminderSettings>({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });

      if (response.success) {
        setToast({ message: '设置已保存', type: 'success' });
      } else {
        setToast({ message: response.error || '保存失败', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setToast({ message: '保存设置失败，请重试', type: 'error' });
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
        setToast({ message: '已清除所有网站', type: 'success' });
      } else {
        setToast({ message: response.error || '清除失败', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to clear sites:', err);
      setToast({ message: '清除网站失败，请重试', type: 'error' });
    }
  };

  const handleResetAllStatus = async () => {
    try {
      const response = await sendMessage({ type: 'RESET_ALL_STATUS' });
      if (response.success) {
        await loadData();
        setConfirmDialog({ type: null });
        setToast({ message: '已重置今日状态', type: 'success' });
      } else {
        setToast({ message: response.error || '重置失败', type: 'error' });
      }
    } catch (err) {
      console.error('Failed to reset status:', err);
      setToast({ message: '重置状态失败，请重试', type: 'error' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <svg
              className="animate-spin w-8 h-8 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            签到助手设置
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            自定义您的签到提醒和偏好设置
          </p>
        </header>

        {/* Settings Sections */}
        <div className="space-y-4 sm:space-y-5">
          {/* Appearance Settings */}
          <SectionCard
            title="外观"
            description="自定义应用外观"
            icon={<PaletteIcon className="w-5 h-5" />}
          >
            <div className="space-y-1">
              <SettingRow label="主题" description="选择浅色、深色或跟随系统设置">
                <ThemeSelector value={settings.theme} onChange={handleThemeChange} />
              </SettingRow>

              <SettingDivider />

              <SettingRow label="显示角标" description="在扩展图标上显示待签到数量">
                <ToggleSwitch enabled={settings.showBadge} onToggle={handleBadgeToggle} />
              </SettingRow>
            </div>
          </SectionCard>

          {/* Reminder Settings */}
          <SectionCard
            title="提醒设置"
            description="配置签到提醒时间和通知"
            icon={<BellIcon className="w-5 h-5" />}
          >
            <div className="space-y-1">
              <SettingRow label="启用提醒" description="在指定时间发送签到提醒通知">
                <ToggleSwitch enabled={settings.enabled} onToggle={handleReminderToggle} />
              </SettingRow>

              {settings.enabled && (
                <>
                  <SettingDivider className="!my-4" />

                  {/* Reminder Times */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

                    <Button
                      variant="outline"
                      onClick={handleAddReminderTime}
                      icon={<PlusIcon className="w-4 h-4" />}
                      className="w-full"
                    >
                      添加提醒时间
                    </Button>
                  </div>

                  <SettingDivider className="!my-4" />

                  <SettingRow label="通知声音" description="提醒时播放通知声音">
                    <ToggleSwitch enabled={settings.sound} onToggle={handleSoundToggle} />
                  </SettingRow>

                  <SettingRow label="稍后提醒" description={'点击"稍后提醒"后的延迟时间'}>
                    <Select
                      value={settings.snoozeMinutes}
                      onChange={(e) => handleSnoozeChange(Number(e.target.value))}
                    >
                      <option value={15}>15 分钟</option>
                      <option value={30}>30 分钟</option>
                      <option value={60}>1 小时</option>
                      <option value={120}>2 小时</option>
                    </Select>
                  </SettingRow>
                </>
              )}
            </div>
          </SectionCard>

          {/* Auto-detect Settings */}
          <SectionCard
            title="自动检测"
            description="配置自动访问检测行为"
            icon={<EyeIcon className="w-5 h-5" />}
          >
            <SettingRow
              label="自动标记访问"
              description="访问已保存网站时自动标记为已访问（需网站开启自动检测）"
            >
              <ToggleSwitch enabled={settings.autoMarkOnVisit} onToggle={handleAutoMarkToggle} />
            </SettingRow>
          </SectionCard>

          {/* Daily Reset Settings */}
          <SectionCard
            title="每日重置"
            description="配置每日状态重置时间"
            icon={<ClockIcon className="w-5 h-5" />}
          >
            <SettingRow label="重置时间" description="每日重置签到状态的时间（24小时制）">
              <Select
                value={settings.resetTime}
                onChange={(e) => handleResetTimeChange(Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </Select>
            </SettingRow>
          </SectionCard>

          {/* Data Management */}
          <SectionCard
            title="数据管理"
            description="管理保存的网站数据"
            icon={<DatabaseIcon className="w-5 h-5" />}
          >
            <div className="space-y-4">
              {/* Site count info */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    已保存网站
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">共 {siteCount} 个网站</p>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {siteCount}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="warning"
                  onClick={() => setConfirmDialog({ type: 'reset' })}
                  disabled={siteCount === 0}
                  className="flex-1"
                >
                  重置今日状态
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDialog({ type: 'clear' })}
                  disabled={siteCount === 0}
                  className="flex-1"
                >
                  清除所有网站
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Save Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
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
        icon="danger"
      />

      <ConfirmDialog
        isOpen={confirmDialog.type === 'reset'}
        title="重置今日状态？"
        message={'确定要重置所有网站的今日签到状态吗？这将清除所有"已访问"和"已签到"标记。'}
        confirmText="确认重置"
        onConfirm={handleResetAllStatus}
        onCancel={() => setConfirmDialog({ type: null })}
        icon="warning"
      />

      {/* Toast Notification */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type}
        visible={!!toast}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
