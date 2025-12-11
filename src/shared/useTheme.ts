import { useEffect, useState, useCallback } from 'react';
import type { Settings } from '@/shared/types';

type Theme = 'light' | 'dark' | 'system';

/**
 * Hook to manage theme state and apply it to the document
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Function to resolve system theme
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Function to apply theme to document
  const applyTheme = useCallback(
    (newTheme: Theme) => {
      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
      setResolvedTheme(resolved);

      if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    [getSystemTheme]
  );

  // Load theme from storage on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const result = await chrome.storage.sync.get('settings');
        const settings = result.settings as Settings | undefined;
        const savedTheme = settings?.theme || 'system';
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } catch {
        // Default to system theme if storage fails
        applyTheme('system');
      }
    }

    loadTheme();

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.settings?.newValue) {
        const newTheme = changes.settings.newValue.theme as Theme;
        if (newTheme && newTheme !== theme) {
          setTheme(newTheme);
          applyTheme(newTheme);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [applyTheme, theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  return { theme, resolvedTheme, setTheme };
}

export default useTheme;
