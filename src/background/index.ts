/**
 * Background Service Worker
 *

 * This service worker handles all background operations for the 签到助手 extension:
 *
 * ## Responsibilities
 * - **Message Router**: Handle messages from popup and content scripts
 * - **Alarm Handler**: Schedule and process reminder alarms using chrome.alarms
 * - **Notification Manager**: Create and manage Chrome notifications with action buttons
 * - **Storage Manager**: CRUD operations for site data via the storage layer
 * - **Visit Detection**: Process auto-detected visits from content scripts
 *
 * ## Message Flow
 * ```
 * Popup/Options ─────┐
 *                    │
 *                    ▼
 *              ┌─────────────┐     chrome.storage
 *              │  Background │◄───────────────────►  Storage
 *              │   Service   │
 *              │   Worker    │     chrome.alarms
 *              └─────────────┘◄───────────────────►  Alarms
 *                    ▲
 *                    │
 * Content Script ────┘
 * ```
 */

import type { Message, MessageResponse, SiteVisitedPayload, UrlMatchResult } from '@/shared/types';
import { ALARM_NAMES, NOTIFICATION_IDS } from '@/shared/types';
import {
  getSites,
  getSiteByUrl,
  addSite,
  updateSite,
  updateStatus,
  deleteSite,
  getSettings,
  updateSettings,
  resetDailyStatus,
  clearAllData,
  getPendingCount,
  onSitesChange,
  type SiteEntry,
  type ReminderSettings,
  type AddSiteInput,
  type UpdateSiteInput,
} from '@/lib/storage';

// ============================================================================
// Service Worker Initialization
// ============================================================================


console.log('签到助手 Background Service Worker started');

// Listen to site changes to keep badge同步，避免前端直接写存储时角标不同步
onSitesChange(async () => {
  await updateBadgeCount();
});

// ============================================================================
// Message Handling
// ============================================================================

/**
 * Main message listener for all extension components
 *
 * This listener handles messages from:
 * - Popup UI (site management, settings)
 * - Options page (settings updates)
 * - Content scripts (visit detection)
 */
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    // Log message for debugging (remove in production)
    console.debug('[Background] Received message:', message.type, 'from:', sender.id || 'popup');

    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Background] Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Route and handle incoming messages
 */
async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    // Site management
    case 'GET_SITES':
      return handleGetSites();

    case 'SAVE_SITE':
      return handleSaveSite(message.payload as AddSiteInput);

    case 'UPDATE_SITE':
      return handleUpdateSite(message.payload as { id: string; updates: UpdateSiteInput });

    case 'DELETE_SITE':
      return handleDeleteSite(message.payload as string);

    case 'MARK_VISITED':
      return handleMarkVisited(message.payload as string);

    case 'MARK_CHECKED_IN':
      return handleMarkCheckedIn(message.payload as string);

    // Content script messages
    case 'SITE_VISITED':
      return handleSiteVisited(message.payload as SiteVisitedPayload);

    case 'CHECK_URL_MATCH':
      return handleCheckUrlMatch(message.payload as { url: string });

    // Settings management
    case 'GET_SETTINGS':
      return handleGetSettings();

    case 'UPDATE_SETTINGS':
      return handleUpdateSettings(message.payload as Partial<ReminderSettings>);

    // Bulk operations
    case 'CLEAR_ALL_SITES':
      return handleClearAllSites();

    case 'RESET_ALL_STATUS':
      return handleResetAllStatus();

    // Popup control
    case 'OPEN_POPUP':
      return handleOpenPopup();

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

// ============================================================================
// Site Management Handlers
// ============================================================================

/**
 * Get all saved sites
 */
async function handleGetSites(): Promise<MessageResponse<SiteEntry[]>> {
  try {
    const sites = await getSites();
    return { success: true, data: sites };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Save a new site
 */
async function handleSaveSite(input: AddSiteInput): Promise<MessageResponse<SiteEntry>> {
  try {
    const site = await addSite(input);
    await updateBadgeCount();
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an existing site
 */
async function handleUpdateSite(payload: {
  id: string;
  updates: UpdateSiteInput;
}): Promise<MessageResponse<SiteEntry>> {
  try {
    const site = await updateSite(payload.id, payload.updates);
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a site
 */
async function handleDeleteSite(siteId: string): Promise<MessageResponse> {
  try {
    await deleteSite(siteId);
    await updateBadgeCount();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Mark a site as visited
 */
async function handleMarkVisited(siteId: string): Promise<MessageResponse<SiteEntry>> {
  try {
    const site = await updateStatus(siteId, 'visited', true);
    await updateBadgeCount();
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Mark a site as checked in
 */
async function handleMarkCheckedIn(siteId: string): Promise<MessageResponse<SiteEntry>> {
  try {
    const site = await updateStatus(siteId, 'checkedIn', true);
    await updateBadgeCount();
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================================
// Content Script Handlers
// ============================================================================

/**
 * Handle automatic site visit detection from content script
 *
 * When a user visits a saved site, the content script sends this message.
 * We then update the visit status and optionally show a notification.
 */
async function handleSiteVisited(payload: SiteVisitedPayload): Promise<MessageResponse<SiteEntry>> {
  try {
    const settings = await getSettings();

    // Check if auto-detect is enabled globally
    if (!settings.autoMarkOnVisit) {
      return { success: true };
    }

    // Find matching site
    const site = await getSiteByUrl(payload.url);
    if (!site) {
      return { success: true }; // No matching site, not an error
    }

    // Check if site has auto-detect enabled
    if (!site.autoDetect) {
      return { success: true };
    }

    // Already visited today? Skip
    if (site.visitedStatus) {
      return { success: true, data: site };
    }

    // Mark as visited
    const updatedSite = await updateStatus(site.id, 'visited', true);
    await updateBadgeCount();

    // Show notification if enabled
    if (settings.enabled) {
      await showSiteVisitNotification(updatedSite);
    }

    return { success: true, data: updatedSite };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Check if a URL matches any saved site
 */
async function handleCheckUrlMatch(payload: { url: string }): Promise<MessageResponse<UrlMatchResult>> {
  try {
    const site = await getSiteByUrl(payload.url);

    if (!site) {
      return { success: true, data: { matched: false } };
    }

    return {
      success: true,
      data: {
        matched: true,
        siteId: site.id,
        siteName: site.title,
        alreadyVisitedToday: site.visitedStatus,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================================
// Settings Handlers
// ============================================================================

/**
 * Get user settings
 */
async function handleGetSettings(): Promise<MessageResponse<ReminderSettings>> {
  try {
    const settings = await getSettings();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update user settings and reconfigure alarms if needed
 */
async function handleUpdateSettings(
  updates: Partial<ReminderSettings>
): Promise<MessageResponse<ReminderSettings>> {
  try {
    const settings = await updateSettings(updates);

    // Reconfigure alarms if reminder settings changed
    if ('enabled' in updates || 'times' in updates) {
      await configureReminders(settings);
    }

    // Update badge if badge setting changed
    if ('showBadge' in updates) {
      if (settings.showBadge) {
        await updateBadgeCount();
      } else {
        await chrome.action.setBadgeText({ text: '' });
      }
    }

    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================================
// Bulk Operation Handlers
// ============================================================================

/**
 * Clear all saved sites
 */
async function handleClearAllSites(): Promise<MessageResponse> {
  try {
    await clearAllData();
    await updateBadgeCount();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reset daily status for all sites
 */
async function handleResetAllStatus(): Promise<MessageResponse<SiteEntry[]>> {
  try {
    const sites = await resetDailyStatus();
    await updateBadgeCount();
    return { success: true, data: sites };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Open the extension popup
 */
async function handleOpenPopup(): Promise<MessageResponse> {
  try {
    await chrome.action.openPopup();
    return { success: true };
  } catch (error) {
    // openPopup may fail in certain contexts, which is okay
    return { success: true };
  }
}

// ============================================================================
// Alarm Management
// ============================================================================

/**
 * Configure reminder alarms based on settings
 */
async function configureReminders(settings: ReminderSettings): Promise<void> {
  // Clear all existing reminder alarms
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith(ALARM_NAMES.DAILY_REMINDER_PREFIX)) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  if (!settings.enabled) {
    console.log('[Background] Reminders disabled');
    return;
  }

  // Create alarms for each enabled reminder time
  for (const time of settings.times) {
    if (!time.enabled) continue;

    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(time.hour, time.minute, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const alarmName = `${ALARM_NAMES.DAILY_REMINDER_PREFIX}${time.id}`;

    await chrome.alarms.create(alarmName, {
      when: alarmTime.getTime(),
      periodInMinutes: 24 * 60, // Repeat daily
    });

    console.log(`[Background] Created alarm "${alarmName}" for ${alarmTime.toLocaleString()}`);
  }
}

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[Background] Alarm fired:', alarm.name);

  if (alarm.name.startsWith(ALARM_NAMES.DAILY_REMINDER_PREFIX)) {
    await handleReminderAlarm(alarm);
  } else if (alarm.name === ALARM_NAMES.DAILY_RESET) {
    await handleDailyResetAlarm();
  }
});

/**
 * Handle reminder alarm - check for pending check-ins and send notification
 */
async function handleReminderAlarm(_alarm: chrome.alarms.Alarm): Promise<void> {
  const settings = await getSettings();

  if (!settings.enabled) {
    return;
  }

  const pendingCount = await getPendingCount();

  if (pendingCount > 0) {
    await showReminderNotification(pendingCount, settings);
  }
}

/**
 * Handle daily reset alarm
 */
async function handleDailyResetAlarm(): Promise<void> {
  console.log('[Background] Executing daily reset');
  await resetDailyStatus();
  await updateBadgeCount();
}

// ============================================================================
// Notification Management
// ============================================================================

/**
 * Show reminder notification with action buttons
 */
async function showReminderNotification(
  pendingCount: number,
  settings: ReminderSettings
): Promise<void> {
  const notificationOptions: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: '签到提醒',
    message: `还有 ${pendingCount} 个网站等待签到`,
    priority: 2,
    requireInteraction: true,
    silent: !settings.sound,
    buttons: [{ title: '📋 查看列表' }, { title: '⏰ 稍后提醒' }],
  };

  chrome.notifications.create(NOTIFICATION_IDS.CHECKIN_REMINDER, notificationOptions);
}

/**
 * Show notification when a site is visited (for quick check-in)
 */
async function showSiteVisitNotification(site: SiteEntry): Promise<void> {
  const notificationId = `${NOTIFICATION_IDS.SITE_VISIT_PREFIX}${site.id}`;

  const notificationOptions: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl: site.favicon || chrome.runtime.getURL('icons/icon128.png'),
    title: `访问: ${site.title}`,
    message: '已自动标记为已访问。要标记为已签到吗？',
    priority: 1,
    buttons: [{ title: '✅ 标记已签到' }, { title: '👀 仅已访问' }],
  };

  chrome.notifications.create(notificationId, notificationOptions);
}

/**
 * Handle notification click
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  console.log('[Background] Notification clicked:', notificationId);

  if (notificationId === NOTIFICATION_IDS.CHECKIN_REMINDER) {
    // Open the popup
    try {
      await chrome.action.openPopup();
    } catch {
      // If openPopup fails, open options page as fallback
      await chrome.runtime.openOptionsPage();
    }
  } else if (notificationId.startsWith(NOTIFICATION_IDS.SITE_VISIT_PREFIX)) {
    // Open the popup for the specific site
    try {
      await chrome.action.openPopup();
    } catch {
      // Fallback
    }
  }

  // Clear the notification
  await chrome.notifications.clear(notificationId);
});

/**
 * Handle notification button clicks
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('[Background] Notification button clicked:', notificationId, buttonIndex);

  if (notificationId === NOTIFICATION_IDS.CHECKIN_REMINDER) {
    if (buttonIndex === 0) {
      // "查看列表" - Open popup
      try {
        await chrome.action.openPopup();
      } catch {
        await chrome.runtime.openOptionsPage();
      }
    } else if (buttonIndex === 1) {
      // "稍后提醒" - Snooze for configured duration
      const settings = await getSettings();
      const snoozeMinutes = settings.snoozeMinutes || 30;

      await chrome.alarms.create('snooze-reminder', {
        delayInMinutes: snoozeMinutes,
      });

      console.log(`[Background] Snoozed reminder for ${snoozeMinutes} minutes`);
    }
  } else if (notificationId.startsWith(NOTIFICATION_IDS.SITE_VISIT_PREFIX)) {
    const siteId = notificationId.replace(NOTIFICATION_IDS.SITE_VISIT_PREFIX, '');

    if (buttonIndex === 0) {
      // "标记已签到"
      await updateStatus(siteId, 'checkedIn', true);
      await updateBadgeCount();
    }
    // buttonIndex === 1: "仅已访问" - already marked as visited, do nothing
  }

  // Clear the notification
  await chrome.notifications.clear(notificationId);
});

/**
 * Handle notification closed
 */
chrome.notifications.onClosed.addListener((notificationId, _byUser) => {
  console.log('[Background] Notification closed:', notificationId);
});

// ============================================================================
// Badge Management
// ============================================================================

/**
 * Update the extension badge with pending count
 */
async function updateBadgeCount(): Promise<void> {
  try {
    const settings = await getSettings();

    if (!settings.showBadge) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    const pendingCount = await getPendingCount();

    if (pendingCount > 0) {
      await chrome.action.setBadgeText({ text: pendingCount.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' }); // Amber
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('[Background] Error updating badge:', error);
  }
}

// ============================================================================
// Extension Lifecycle
// ============================================================================

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First install - settings are initialized by the storage layer defaults
    console.log('[Background] First install - initializing extension');
  } else if (details.reason === 'update') {
    console.log('[Background] Extension updated from version:', details.previousVersion);
  }


  // Configure reminders based on saved settings
  const settings = await getSettings();
  await configureReminders(settings);

  // Update badge
  await updateBadgeCount();

  // Set up daily reset alarm
  await setupDailyResetAlarm(settings);
});

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Background] Extension startup');

  // Reconfigure alarms (they may have been lost)
  const settings = await getSettings();
  await configureReminders(settings);
  await setupDailyResetAlarm(settings);

  // Update badge
  await updateBadgeCount();
});

/**
 * Set up the daily reset alarm
 */
async function setupDailyResetAlarm(settings: ReminderSettings): Promise<void> {
  // Clear existing reset alarm
  await chrome.alarms.clear(ALARM_NAMES.DAILY_RESET);

  const now = new Date();
  const resetTime = new Date();
  resetTime.setHours(settings.resetTime, 0, 0, 0);

  // If reset time has passed today, schedule for tomorrow
  if (resetTime <= now) {
    resetTime.setDate(resetTime.getDate() + 1);
  }

  await chrome.alarms.create(ALARM_NAMES.DAILY_RESET, {
    when: resetTime.getTime(),
    periodInMinutes: 24 * 60,
  });

  console.log(`[Background] Daily reset alarm set for ${resetTime.toLocaleString()}`);
}

