import { useEffect, useState } from 'react';
import type { Site, Message, MessageResponse } from '@/shared/types';
import { wasVisitedToday, getFaviconUrl } from '@/shared/utils';

/**
 * Send message to background script
 */
async function sendMessage<T>(message: Message): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

/**
 * Popup App Component
 */
export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  // Load sites and current tab on mount
  useEffect(() => {
    loadSites();
    getCurrentTab();
  }, []);

  async function loadSites() {
    try {
      const response = await sendMessage<Site[]>({ type: 'GET_SITES' });
      if (response.success && response.data) {
        setSites(response.data);
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    } finally {
      setLoading(false);
    }
  }

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    setCurrentTab(tab);
  }

  async function handleSaveCurrentSite() {
    if (!currentTab?.url || !currentTab?.title) return;

    try {
      const response = await sendMessage<Site>({
        type: 'SAVE_SITE',
        payload: {
          url: currentTab.url,
          title: currentTab.title,
          favicon: currentTab.favIconUrl || getFaviconUrl(currentTab.url),
        },
      });

      if (response.success && response.data) {
        setSites((prev) => [...prev, response.data as Site]);
      } else if (response.error) {
        alert(response.error);
      }
    } catch (error) {
      console.error('Failed to save site:', error);
    }
  }

  async function handleMarkVisited(siteId: string) {
    try {
      const response = await sendMessage<Site>({
        type: 'MARK_VISITED',
        payload: siteId,
      });

      if (response.success && response.data) {
        setSites((prev) => prev.map((s) => (s.id === siteId ? (response.data as Site) : s)));
      }
    } catch (error) {
      console.error('Failed to mark visited:', error);
    }
  }

  async function handleDeleteSite(siteId: string) {
    try {
      const response = await sendMessage({ type: 'DELETE_SITE', payload: siteId });
      if (response.success) {
        setSites((prev) => prev.filter((s) => s.id !== siteId));
      }
    } catch (error) {
      console.error('Failed to delete site:', error);
    }
  }

  function handleOpenSite(url: string) {
    chrome.tabs.create({ url });
  }

  function handleOpenOptions() {
    chrome.runtime.openOptionsPage();
  }

  // Check if current tab is already saved
  const isCurrentSiteSaved = sites.some((s) => s.url === currentTab?.url);

  // Count pending and completed sites
  const pendingCount = sites.filter((s) => !wasVisitedToday(s.lastVisitedAt)).length;
  const completedCount = sites.length - pendingCount;

  return (
    <div className="w-[360px] min-h-[200px] max-h-[500px] flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">签到助手</h1>
        <button
          onClick={handleOpenOptions}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="设置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 text-sm">
        <span className="text-gray-600">
          今日进度:{' '}
          <span className="font-medium text-primary-600">
            {completedCount}/{sites.length}
          </span>
        </span>
        {pendingCount > 0 && (
          <span className="text-amber-600 font-medium">{pendingCount} 个待签到</span>
        )}
      </div>

      {/* Quick Add Button */}
      {currentTab?.url && !currentTab.url.startsWith('chrome://') && (
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={handleSaveCurrentSite}
            disabled={isCurrentSiteSaved}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isCurrentSiteSaved
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isCurrentSiteSaved ? '✓ 已添加此网站' : '+ 添加当前网站'}
          </button>
        </div>
      )}

      {/* Site List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">加载中...</div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">还没有添加任何网站</p>
            <p className="text-xs text-gray-400 mt-1">点击上方按钮添加当前网站</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sites.map((site) => {
              const isVisitedToday = wasVisitedToday(site.lastVisitedAt);
              return (
                <li
                  key={site.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Favicon */}
                  <img
                    src={site.favicon || getFaviconUrl(site.url)}
                    alt=""
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>';
                    }}
                  />

                  {/* Site Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${isVisitedToday ? 'text-gray-400' : 'text-gray-900'}`}
                    >
                      {site.title}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Open Site */}
                    <button
                      onClick={() => handleOpenSite(site.url)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="打开网站"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>

                    {/* Mark Visited */}
                    <button
                      onClick={() => handleMarkVisited(site.id)}
                      className={`p-1.5 rounded transition-colors ${
                        isVisitedToday
                          ? 'text-success-500 bg-success-500/10'
                          : 'text-gray-400 hover:text-success-600 hover:bg-success-50'
                      }`}
                      title={isVisitedToday ? '今日已签到' : '标记为已签到'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-500/10 rounded transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
