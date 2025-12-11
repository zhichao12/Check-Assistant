/**
 * Represents a saved check-in site
 */
export interface Site {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  lastVisitedAt?: number;
  visitCount: number;
}

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  enabled: boolean;
  times: string[]; // Array of times in HH:MM format
}

/**
 * User settings
 */
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  reminder: ReminderConfig;
  autoDetectVisits: boolean;
  notificationsEnabled: boolean;
}

/**
 * Message types for communication between extension components
 *
 * ## Message Flow Documentation
 *
 * ### Popup → Background
 * - `SAVE_SITE` - Save a new site to storage
 * - `GET_SITES` - Retrieve all saved sites
 * - `UPDATE_SITE` - Update an existing site
 * - `DELETE_SITE` - Remove a site from storage
 * - `MARK_VISITED` - Mark a site as visited (manual action)
 * - `MARK_CHECKED_IN` - Mark a site as checked in (manual action)
 * - `GET_SETTINGS` - Retrieve user settings
 * - `UPDATE_SETTINGS` - Update user settings
 * - `CLEAR_ALL_SITES` - Remove all saved sites
 * - `RESET_ALL_STATUS` - Reset daily status for all sites
 *
 * ### Content Script → Background
 * - `SITE_VISITED` - Auto-detected visit to a saved site
 * - `CHECK_URL_MATCH` - Check if current URL matches any saved site
 *
 * ### Background → Popup/Content (via response or broadcast)
 * - Responses contain `{ success: boolean, data?: T, error?: string }`
 *
 * ### Notification Actions
 * - `NOTIFICATION_ACTION` - Handle notification button clicks
 * - `OPEN_POPUP` - Request to open the extension popup
 */
export type MessageType =
  | 'SAVE_SITE'
  | 'GET_SITES'
  | 'UPDATE_SITE'
  | 'DELETE_SITE'
  | 'MARK_VISITED'
  | 'MARK_CHECKED_IN'
  | 'SITE_VISITED'
  | 'CHECK_URL_MATCH'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'CLEAR_ALL_SITES'
  | 'RESET_ALL_STATUS'
  | 'NOTIFICATION_ACTION'
  | 'OPEN_POPUP';

/**
 * Message structure for runtime communication
 */
export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

/**
 * Response structure for message handlers
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Payload for SITE_VISITED message from content script
 */
export interface SiteVisitedPayload {
  url: string;
  title: string;
  timestamp: number;
}

/**
 * Payload for NOTIFICATION_ACTION message
 */
export interface NotificationActionPayload {
  notificationId: string;
  buttonIndex: number;
  siteId?: string;
}

/**
 * Payload for CHECK_URL_MATCH response
 */
export interface UrlMatchResult {
  matched: boolean;
  siteId?: string;
  siteName?: string;
  alreadyVisitedToday?: boolean;
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  SITES: 'sites',
  SETTINGS: 'settings',
} as const;

/**
 * Alarm names used by the background service worker
 */
export const ALARM_NAMES = {
  DAILY_REMINDER_PREFIX: 'reminder-',
  DAILY_RESET: 'daily-reset',
} as const;

/**
 * Notification IDs used by the extension
 */
export const NOTIFICATION_IDS = {
  CHECKIN_REMINDER: 'checkin-reminder',
  SITE_VISIT_PREFIX: 'site-visit-',
} as const;

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  reminder: {
    enabled: false,
    times: ['09:00'],
  },
  autoDetectVisits: false,
  notificationsEnabled: true,
};
