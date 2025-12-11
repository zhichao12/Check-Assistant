import { useEffect, useState, useCallback, useMemo } from 'react';
import { useStorage } from '@/lib/hooks/useStorage';
import type { SiteEntry, ThemePreference, AddSiteInput } from '@/lib/storage';

/**
 * Theme hook that syncs with storage and applies to document
 */
function useTheme(
  themePreference: ThemePreference | undefined,
  updateTheme: (theme: ThemePreference) => Promise<void>
) {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const applyTheme = () => {
      let theme: 'light' | 'dark';

      if (themePreference === 'system' || !themePreference) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        theme = themePreference;
      }

      setResolvedTheme(theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themePreference === 'system' || !themePreference) {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  const toggleTheme = useCallback(async () => {
    const newTheme: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark';
    await updateTheme(newTheme);
  }, [resolvedTheme, updateTheme]);

  return { resolvedTheme, toggleTheme };
}

/**
 * Loading skeleton component for list items
 */
function SiteListSkeleton() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
        还没有添加签到网站
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
        点击上方按钮添加当前访问的网站，或手动输入网址
      </p>
    </div>
  );
}

/**
 * Status pill component
 */
interface StatusPillProps {
  type: 'visited' | 'checkedIn';
  active: boolean;
}

function StatusPill({ type, active }: StatusPillProps) {
  if (!active) return null;

  const config = {
    visited: {
      label: '已访问',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    checkedIn: {
      label: '已签到',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
  };

  const { label, className } = config[type];

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Site list item component
 */
interface SiteItemProps {
  site: SiteEntry;
  onOpen: (url: string) => void;
  onMarkVisited: (id: string) => void;
  onMarkCheckedIn: (id: string) => void;
  onDelete: (id: string) => void;
  isOptimisticUpdate?: boolean;
}

function SiteItem({
  site,
  onOpen,
  onMarkVisited,
  onMarkCheckedIn,
  onDelete,
  isOptimisticUpdate,
}: SiteItemProps) {
  const faviconSrc =
    site.favicon || `https://www.google.com/s2/favicons?domain=${site.hostname}&sz=32`;

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        isOptimisticUpdate ? 'opacity-70' : ''
      }`}
    >
      {/* Favicon */}
      <img
        src={faviconSrc}
        alt=""
        className="w-5 h-5 rounded flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239ca3af"><circle cx="12" cy="12" r="10"/></svg>';
        }}
      />

      {/* Site Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium truncate ${
              site.checkedInStatus
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-gray-100'
            }`}
          >
            {site.title}
          </p>
          <div className="flex gap-1 flex-shrink-0">
            <StatusPill type="visited" active={site.visitedStatus && !site.checkedInStatus} />
            <StatusPill type="checkedIn" active={site.checkedInStatus} />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{site.hostname}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Open Site */}
        <button
          onClick={() => onOpen(site.url)}
          className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
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
          onClick={() => onMarkVisited(site.id)}
          className={`p-1.5 rounded transition-colors ${
            site.visitedStatus
              ? 'text-blue-500 bg-blue-500/10'
              : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
          title={site.visitedStatus ? '今日已访问' : '标记为已访问'}
          disabled={site.visitedStatus}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {/* Mark Checked In */}
        <button
          onClick={() => onMarkCheckedIn(site.id)}
          className={`p-1.5 rounded transition-colors ${
            site.checkedInStatus
              ? 'text-emerald-500 bg-emerald-500/10'
              : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
          title={site.checkedInStatus ? '今日已签到' : '标记为已签到'}
          disabled={site.checkedInStatus}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(site.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
}

/**
 * Inline add form component
 */
interface InlineAddFormProps {
  onSubmit: (input: AddSiteInput) => void;
  onCancel: () => void;
}

function InlineAddForm({ onSubmit, onCancel }: InlineAddFormProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    onSubmit({
      title: title.trim() || normalizedUrl,
      url: normalizedUrl,
    });

    setTitle('');
    setUrl('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3"
    >
      <div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入网址 (如 example.com)"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          autoFocus
        />
      </div>
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="网站名称 (可选)"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!url.trim()}
          className="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          添加
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

/**
 * Main Popup App Component
 */
export default function App() {
  const {
    sites,
    settings,
    isLoading,
    error,
    addNewSite,
    markSiteStatus,
    removeSite,
    updateUserSettings,
    pendingCount,
    completedCount,
    clearError,
  } = useStorage();

  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Theme management
  const updateTheme = useCallback(
    async (theme: ThemePreference) => {
      await updateUserSettings({ theme });
    },
    [updateUserSettings]
  );

  const { resolvedTheme, toggleTheme } = useTheme(settings?.theme, updateTheme);

  // Get current tab info
  useEffect(() => {
    async function fetchCurrentTab() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          setCurrentTab(tab);
        }
      } catch (err) {
        console.error('Failed to get current tab:', err);
      }
    }
    fetchCurrentTab();
  }, []);

  // Check if current site is already saved
  const isCurrentSiteSaved = useMemo(() => {
    if (!currentTab?.url) return false;
    try {
      const currentHostname = new URL(currentTab.url).hostname;
      return sites.some((s) => s.hostname === currentHostname);
    } catch {
      return false;
    }
  }, [currentTab?.url, sites]);

  // Can add current page (not chrome:// or edge:// etc.)
  const canAddCurrentPage = useMemo(() => {
    if (!currentTab?.url) return false;
    const url = currentTab.url;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
  }, [currentTab?.url]);

  // Handle adding current site
  const handleAddCurrentSite = useCallback(async () => {
    if (!currentTab?.url || !currentTab?.title || isCurrentSiteSaved) return;

    const result = await addNewSite({
      title: currentTab.title,
      url: currentTab.url,
      favicon: currentTab.favIconUrl,
    });

    if (result) {
      setShowInlineForm(false);
    }
  }, [currentTab, isCurrentSiteSaved, addNewSite]);

  // Handle adding from inline form
  const handleInlineAdd = useCallback(
    async (input: AddSiteInput) => {
      const result = await addNewSite(input);
      if (result) {
        setShowInlineForm(false);
      }
    },
    [addNewSite]
  );

  // Handle marking as visited with optimistic update
  const handleMarkVisited = useCallback(
    async (id: string) => {
      setOptimisticIds((prev) => new Set(prev).add(id));
      await markSiteStatus(id, 'visited');
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [markSiteStatus]
  );

  // Handle marking as checked in with optimistic update
  const handleMarkCheckedIn = useCallback(
    async (id: string) => {
      setOptimisticIds((prev) => new Set(prev).add(id));
      await markSiteStatus(id, 'checkedIn');
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [markSiteStatus]
  );

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingIds((prev) => new Set(prev).add(id));
      await removeSite(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [removeSite]
  );

  // Handle opening site
  const handleOpenSite = useCallback((url: string) => {
    chrome.tabs.create({ url });
  }, []);

  // Open options page
  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Filter out deleting sites for display
  const displaySites = useMemo(
    () => sites.filter((s) => !deletingIds.has(s.id)),
    [sites, deletingIds]
  );

  return (
    <div className="w-[360px] min-h-[200px] max-h-[500px] flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">签到助手</h1>
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title={resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {resolvedTheme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={handleOpenOptions}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
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
        </div>
      </header>

      {/* Status Bar */}
      {!isLoading && sites.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-sm border-b border-gray-100 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">
            今日进度:{' '}
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {completedCount}/{sites.length}
            </span>
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {pendingCount} 个待签到
            </span>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={clearError}
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

      {/* Quick Add Section */}
      {!showInlineForm ? (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-2">
          {/* Add Current Page Button */}
          {canAddCurrentPage && (
            <button
              onClick={handleAddCurrentSite}
              disabled={isCurrentSiteSaved}
              className={`w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                isCurrentSiteSaved
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isCurrentSiteSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  已添加此网站
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  添加当前网站
                </>
              )}
            </button>
          )}

          {/* Manual Add Button */}
          <button
            onClick={() => setShowInlineForm(true)}
            className="w-full py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            手动输入网址
          </button>
        </div>
      ) : (
        <InlineAddForm onSubmit={handleInlineAdd} onCancel={() => setShowInlineForm(false)} />
      )}

      {/* Site List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <SiteListSkeleton />
        ) : displaySites.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {displaySites.map((site) => (
              <SiteItem
                key={site.id}
                site={site}
                onOpen={handleOpenSite}
                onMarkVisited={handleMarkVisited}
                onMarkCheckedIn={handleMarkCheckedIn}
                onDelete={handleDelete}
                isOptimisticUpdate={optimisticIds.has(site.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {!isLoading && displaySites.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            共 {sites.length} 个网站 · 点击图标快速操作
          </span>
        </div>
      )}
    </div>
  );
}
