/**
 * Content Script
 *
 * This content script runs on all pages and handles automatic visit detection
 * for saved check-in sites.
 *
 * ## Responsibilities
 * - Detect when the user visits a saved site
 * - Send visit notifications to the background service worker
 * - Handle visibility changes to detect tab switches
 *
 * ## Message Flow
 * ```
 * Content Script                    Background Service Worker
 *       │                                      │
 *       │  ──── CHECK_URL_MATCH ────────────►  │
 *       │                                      │
 *       │  ◄──── { matched, siteId } ───────   │
 *       │                                      │
 *       │  (if matched)                        │
 *       │  ──── SITE_VISITED ──────────────►   │
 *       │                                      │
 *       │  ◄──── { success, site } ─────────   │
 *       │                                      │
 * ```
 *
 * ## Notes
 * - This script runs at `document_idle` to minimize impact on page load
 * - Errors are silently caught to avoid affecting the host page
 * - Duplicate visits (same site, same session) are debounced
 */

import type { Message, UrlMatchResult, SiteVisitedPayload } from '@/shared/types';

// ============================================================================
// State
// ============================================================================

/** Track if we've already notified for this page visit */
let hasNotifiedVisit = false;

/** Track the last URL we processed (for SPA detection) */
let lastProcessedUrl = '';

// ============================================================================
// Messaging Utilities
// ============================================================================

/**
 * Send a message to the background service worker
 */
async function sendMessage<T>(message: Message): Promise<T | null> {
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (response?.success) {
      return response.data as T;
    }
    return null;
  } catch (error) {
    // Extension context may be invalidated if extension was updated/reloaded
    console.debug('[签到助手] Message send failed:', error);
    return null;
  }
}

// ============================================================================
// Visit Detection
// ============================================================================

/**
 * Check if the current page matches a saved site and process the visit
 */
async function processVisit(): Promise<void> {
  const currentUrl = window.location.href;

  // Skip if already processed this URL in this session
  if (hasNotifiedVisit && currentUrl === lastProcessedUrl) {
    return;
  }

  // Skip non-http URLs (chrome://, about:, file://, etc.)
  if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
    return;
  }

  lastProcessedUrl = currentUrl;

  try {
    // First, check if this URL matches any saved site
    const matchResult = await sendMessage<UrlMatchResult>({
      type: 'CHECK_URL_MATCH',
      payload: { url: currentUrl },
    });

    if (!matchResult?.matched) {
      // Not a saved site, nothing to do
      return;
    }

    // Already visited today? Skip notification
    if (matchResult.alreadyVisitedToday) {
      hasNotifiedVisit = true;
      return;
    }

    // Send visit notification to background
    const visitPayload: SiteVisitedPayload = {
      url: currentUrl,
      title: document.title || currentUrl,
      timestamp: Date.now(),
    };

    await sendMessage({
      type: 'SITE_VISITED',
      payload: visitPayload,
    });

    hasNotifiedVisit = true;

    console.debug(`[签到助手] Visit recorded for: ${matchResult.siteName}`);
  } catch (error) {
    // Silently fail - content script errors shouldn't affect the page
    console.debug('[签到助手] Failed to process visit:', error);
  }
}

// ============================================================================
// SPA Navigation Detection
// ============================================================================

/**
 * Set up detection for SPA (Single Page Application) navigation
 *
 * Many modern sites use client-side routing, so we need to detect
 * navigation changes that don't trigger a full page load.
 */
function setupSpaNavigationDetection(): void {
  // Monitor URL changes via History API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };

  // Handle back/forward navigation
  window.addEventListener('popstate', handleUrlChange);
}

/**
 * Handle URL changes (for SPA navigation)
 */
function handleUrlChange(): void {
  // Reset visit tracking for new URLs
  if (window.location.href !== lastProcessedUrl) {
    hasNotifiedVisit = false;
    // Delay slightly to allow SPA to update the page title
    setTimeout(processVisit, 500);
  }
}

// ============================================================================
// Visibility Detection
// ============================================================================

/**
 * Handle page visibility changes
 *
 * When a user switches back to a tab with a saved site,
 * we may want to record that as a new "session" visit.
 */
function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    // Only process if it's been a while since the last visit
    // This prevents duplicate visits from quick tab switches
    processVisit();
  }
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the content script
 */
function initialize(): void {
  // Process initial page visit
  processVisit();

  // Set up SPA navigation detection
  setupSpaNavigationDetection();

  // Handle tab visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  console.debug('[签到助手] Content script initialized');
}

// Run initialization
initialize();

// Export empty object to satisfy module requirements
export {};
