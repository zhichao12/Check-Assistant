import { useEffect, useState } from 'react';
import type { Settings, Message, MessageResponse } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/shared/types';

/**
 * Send message to background script
 */
async function sendMessage<T>(message: Message): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Options Page App Component
 */
export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await sendMessage<Settings>({ type: 'GET_SETTINGS' });
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await sendMessage<Settings>({
        type: 'UPDATE_SETTINGS',
        payload: settings,
      });

      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(theme: Settings['theme']) {
    setSettings((prev) => ({ ...prev, theme }));
  }

  function handleReminderToggle(enabled: boolean) {
    setSettings((prev) => ({
      ...prev,
      reminder: { ...prev.reminder, enabled },
    }));
  }

  function handleReminderTimeChange(index: number, time: string) {
    setSettings((prev) => {
      const times = [...prev.reminder.times];
      times[index] = time;
      return { ...prev, reminder: { ...prev.reminder, times } };
    });
  }

  function handleAddReminderTime() {
    setSettings((prev) => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        times: [...prev.reminder.times, '12:00'],
      },
    }));
  }

  function handleRemoveReminderTime(index: number) {
    setSettings((prev) => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        times: prev.reminder.times.filter((_, i) => i !== index),
      },
    }));
  }

  function handleAutoDetectToggle(enabled: boolean) {
    setSettings((prev) => ({ ...prev, autoDetectVisits: enabled }));
  }

  function handleNotificationsToggle(enabled: boolean) {
    setSettings((prev) => ({ ...prev, notificationsEnabled: enabled }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">签到助手设置</h1>
          <p className="text-gray-600 mt-1">自定义您的签到提醒和偏好设置</p>
        </header>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Theme Settings */}
          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">外观</h2>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">主题</label>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      settings.theme === theme
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Reminder Settings */}
          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">提醒</h2>
            <div className="space-y-4">
              {/* Enable Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">启用提醒</label>
                  <p className="text-xs text-gray-500">在指定时间提醒您签到</p>
                </div>
                <button
                  onClick={() => handleReminderToggle(!settings.reminder.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.reminder.enabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Reminder Times */}
              {settings.reminder.enabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <label className="text-sm font-medium text-gray-700">提醒时间</label>
                  {settings.reminder.times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleReminderTimeChange(index, e.target.value)}
                        className="input flex-1"
                      />
                      {settings.reminder.times.length > 1 && (
                        <button
                          onClick={() => handleRemoveReminderTime(index)}
                          className="p-2 text-gray-400 hover:text-error-500 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddReminderTime}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + 添加提醒时间
                  </button>
                </div>
              )}

              {/* Enable Notifications */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700">桌面通知</label>
                  <p className="text-xs text-gray-500">显示桌面通知提醒</p>
                </div>
                <button
                  onClick={() => handleNotificationsToggle(!settings.notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notificationsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Auto-detect Settings */}
          <section className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">自动检测</h2>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">自动检测访问</label>
                <p className="text-xs text-gray-500">访问已保存网站时自动标记为已签到</p>
              </div>
              <button
                onClick={() => handleAutoDetectToggle(!settings.autoDetectVisits)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoDetectVisits ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoDetectVisits ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-success-600">✓ 已保存</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary min-w-[100px]"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>签到助手 v0.1.0</p>
          <p className="mt-1">Never miss a daily check-in again!</p>
        </footer>
      </div>
    </div>
  );
}
