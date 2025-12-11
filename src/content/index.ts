/**
 * Content Script
 *
 * Handles:
 * - Auto-detection of visits to saved sites
 * - Communication with background service worker
 */

import type { Message, Settings } from '@/shared/types';

/**
 * Notify background script of page visit
 */
async function notifyVisit(): Promise<void> {
  try {
    // First check if auto-detect is enabled
    const settingsResponse = await chrome.runtime.sendMessage<Message>({
      type: 'GET_SETTINGS',
    });

    const settings = settingsResponse?.data as Settings | undefined;
    if (!settings?.autoDetectVisits) {
      return;
    }

    // Send visit notification to background
    await chrome.runtime.sendMessage<Message>({
      type: 'SITE_VISITED',
      payload: {
        url: window.location.href,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    // Silently fail - content script errors shouldn't affect page
    console.debug('签到助手: Failed to notify visit', error);
  }
}

// Notify on page load
notifyVisit();

// Also notify on page visibility change (in case user switches tabs)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    notifyVisit();
  }
});

// Export empty object to satisfy module requirements
export {};
