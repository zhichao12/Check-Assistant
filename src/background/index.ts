/**
 * Background Service Worker
 *
 * Handles:
 * - Message routing from popup/content scripts
 * - Alarm scheduling for reminders
 * - Chrome notifications
 * - Storage management
 */

import type { Message, MessageResponse, Site, Settings } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/types';
import { generateId } from '@/shared/utils';

// Log service worker startup
console.log('签到助手 Background Service Worker started');

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Route and handle incoming messages
 */
async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case 'GET_SITES':
      return getSites();

    case 'SAVE_SITE':
      return saveSite(message.payload as Partial<Site>);

    case 'UPDATE_SITE':
      return updateSite(message.payload as Site);

    case 'DELETE_SITE':
      return deleteSite(message.payload as string);

    case 'MARK_VISITED':
      return markSiteVisited(message.payload as string);

    case 'SITE_VISITED':
      return handleSiteVisited(message.payload as { url: string });

    case 'GET_SETTINGS':
      return getSettings();

    case 'UPDATE_SETTINGS':
      return updateSettings(message.payload as Partial<Settings>);

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

/**
 * Get all saved sites
 */
async function getSites(): Promise<MessageResponse<Site[]>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites = result[STORAGE_KEYS.SITES] || [];
  return { success: true, data: sites };
}

/**
 * Save a new site
 */
async function saveSite(siteData: Partial<Site>): Promise<MessageResponse<Site>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];

  // Check for duplicate URL
  const existingSite = sites.find((s) => s.url === siteData.url);
  if (existingSite) {
    return { success: false, error: 'Site already exists' };
  }

  const newSite: Site = {
    id: generateId(),
    url: siteData.url || '',
    title: siteData.title || '',
    favicon: siteData.favicon,
    notes: siteData.notes,
    tags: siteData.tags || [],
    createdAt: Date.now(),
    visitCount: 0,
  };

  sites.push(newSite);
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITES]: sites });

  return { success: true, data: newSite };
}

/**
 * Update an existing site
 */
async function updateSite(site: Site): Promise<MessageResponse<Site>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];

  const index = sites.findIndex((s) => s.id === site.id);
  if (index === -1) {
    return { success: false, error: 'Site not found' };
  }

  sites[index] = site;
  await chrome.storage.sync.set({ [STORAGE_KEYS.SITES]: sites });

  return { success: true, data: site };
}

/**
 * Delete a site
 */
async function deleteSite(siteId: string): Promise<MessageResponse> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];

  const filteredSites = sites.filter((s) => s.id !== siteId);

  if (filteredSites.length === sites.length) {
    return { success: false, error: 'Site not found' };
  }

  await chrome.storage.sync.set({ [STORAGE_KEYS.SITES]: filteredSites });
  return { success: true };
}

/**
 * Mark a site as visited
 */
async function markSiteVisited(siteId: string): Promise<MessageResponse<Site>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];

  const site = sites.find((s) => s.id === siteId);
  if (!site) {
    return { success: false, error: 'Site not found' };
  }

  site.lastVisitedAt = Date.now();
  site.visitCount += 1;

  await chrome.storage.sync.set({ [STORAGE_KEYS.SITES]: sites });
  return { success: true, data: site };
}

/**
 * Handle automatic site visit detection from content script
 */
async function handleSiteVisited(payload: { url: string }): Promise<MessageResponse> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SITES);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];

  const site = sites.find((s) => payload.url.startsWith(s.url) || s.url.startsWith(payload.url));

  if (site) {
    site.lastVisitedAt = Date.now();
    site.visitCount += 1;
    await chrome.storage.sync.set({ [STORAGE_KEYS.SITES]: sites });
    return { success: true, data: site };
  }

  return { success: true }; // No matching site found, but not an error
}

/**
 * Get user settings
 */
async function getSettings(): Promise<MessageResponse<Settings>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
  return { success: true, data: settings };
}

/**
 * Update user settings
 */
async function updateSettings(newSettings: Partial<Settings>): Promise<MessageResponse<Settings>> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const currentSettings: Settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;

  const updatedSettings = { ...currentSettings, ...newSettings };
  await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: updatedSettings });

  // Update alarms if reminder settings changed
  if (newSettings.reminder) {
    await updateReminders(updatedSettings);
  }

  return { success: true, data: updatedSettings };
}

/**
 * Update reminder alarms based on settings
 */
async function updateReminders(settings: Settings): Promise<void> {
  // Clear existing alarms
  await chrome.alarms.clearAll();

  if (!settings.reminder.enabled) {
    return;
  }

  // Create alarms for each reminder time
  for (const time of settings.reminder.times) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    await chrome.alarms.create(`reminder-${time}`, {
      when: alarmTime.getTime(),
      periodInMinutes: 24 * 60, // Repeat daily
    });
  }
}

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('reminder-')) {
    await checkAndNotify();
  }
});

/**
 * Check for pending check-ins and send notification
 */
async function checkAndNotify(): Promise<void> {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.SITES, STORAGE_KEYS.SETTINGS]);
  const sites: Site[] = result[STORAGE_KEYS.SITES] || [];
  const settings: Settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;

  if (!settings.notificationsEnabled) {
    return;
  }

  // Count sites not visited today
  const today = new Date();
  const pendingCount = sites.filter((site) => {
    if (!site.lastVisitedAt) return true;
    const visitDate = new Date(site.lastVisitedAt);
    return (
      visitDate.getFullYear() !== today.getFullYear() ||
      visitDate.getMonth() !== today.getMonth() ||
      visitDate.getDate() !== today.getDate()
    );
  }).length;

  if (pendingCount > 0) {
    await chrome.notifications.create('checkin-reminder', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '签到提醒',
      message: `还有 ${pendingCount} 个网站等待签到`,
    });
  }
}

/**
 * Handle notification click
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'checkin-reminder') {
    // Open the popup by focusing the extension
    chrome.action.openPopup();
  }
});

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('签到助手 installed');
    // Initialize with default settings
    await chrome.storage.sync.set({
      [STORAGE_KEYS.SITES]: [],
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    });
  }
});
