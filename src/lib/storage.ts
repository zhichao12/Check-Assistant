/**
 * Storage Layer - Typed data layer encapsulating Chrome Storage API usage
 */

import { generateId } from '@/shared/utils';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Represents the check-in status tracking for a site entry
 */
export interface CheckInRecord {
  timestamp: number;
  type: 'visit' | 'manual';
}

/**
 * Represents a saved check-in site entry with full status tracking
 */
export interface SiteEntry {
  /** Unique identifier (UUID-like) */
  id: string;
  /** Page title */
  title: string;
  /** Full URL of the site */
  url: string;
  /** Hostname extracted from URL for matching */
  hostname: string;
  /** Favicon URL or data URI */
  favicon: string;
  /** Optional user notes */
  notes?: string;
  /** Optional categorization tags */
  tags?: string[];
  /** Whether the site has been visited today */
  visitedStatus: boolean;
  /** Whether the site has been manually checked-in today */
  checkedInStatus: boolean;
  /** Timestamp of last visit (null if never visited) */
  lastVisitedAt: number | null;
  /** Timestamp of last manual check-in (null if never checked in) */
  lastCheckedInAt: number | null;
  /** Historical check-in records */
  checkInHistory: CheckInRecord[];
  /** How often the user wants to check in */
  frequency: CheckInFrequency;
  /** Whether to auto-detect visits for this site */
  autoDetect: boolean;
  /** Whether to include this site in reminders */
  reminderEnabled: boolean;
  /** Timestamp when the entry was created */
  createdAt: number;
  /** Timestamp when the entry was last updated */
  updatedAt: number;
}

/**
 * Check-in frequency options
 */
export type CheckInFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Individual reminder time configuration
 */
export interface ReminderTime {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  days: DayOfWeek[]; // Which days to trigger
  enabled: boolean;
}

/**
 * Day of week representation (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Reminder settings configuration
 */
export interface ReminderSettings {
  /** Whether reminders are globally enabled */
  enabled: boolean;
  /** Multiple reminder times configuration */
  times: ReminderTime[];
  /** Whether to play notification sound */
  sound: boolean;
  /** Default snooze duration in minutes */
  snoozeMinutes: number;
  /** Global auto-mark on visit option */
  autoMarkOnVisit: boolean;
  /** Theme preference */
  theme: ThemePreference;
  /** Show badge count on extension icon */
  showBadge: boolean;
  /** Hour to reset daily check-ins (0-23) */
  resetTime: number;
}

/**
 * Theme preference options
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Storage schema structure
 */
export interface StorageSchema {
  sites: SiteEntry[];
  settings: ReminderSettings;
}

/**
 * Storage area selection
 */
export type StorageArea = 'sync' | 'local';

/**
 * Status update type for updateStatus function
 */
export type StatusType = 'visited' | 'checkedIn';

/**
 * Input type for adding a new site (partial fields required)
 */
export interface AddSiteInput {
  title: string;
  url: string;
  favicon?: string;
  notes?: string;
  tags?: string[];
  frequency?: CheckInFrequency;
  autoDetect?: boolean;
  reminderEnabled?: boolean;
}

/**
 * Update site input (partial fields)
 */
export type UpdateSiteInput = Partial<
  Omit<SiteEntry, 'id' | 'createdAt' | 'updatedAt' | 'hostname'>
>;

/**
 * Storage change callback type
 */
export type StorageChangeCallback<T> = (newValue: T | undefined, oldValue: T | undefined) => void;

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default reminder time (9:00 AM on weekdays)
 */
const DEFAULT_REMINDER_TIME: ReminderTime = {
  id: 'default',
  hour: 9,
  minute: 0,
  days: [1, 2, 3, 4, 5], // Monday to Friday
  enabled: true,
};

/**
 * Default reminder settings
 */
export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  times: [DEFAULT_REMINDER_TIME],
  sound: true,
  snoozeMinutes: 30,
  autoMarkOnVisit: false,
  theme: 'system',
  showBadge: true,
  resetTime: 0, // Midnight
};

/**
 * Default storage schema
 */
export const DEFAULT_STORAGE: StorageSchema = {
  sites: [],
  settings: DEFAULT_REMINDER_SETTINGS,
};

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  SITES: 'sites',
  SETTINGS: 'settings',
} as const;

// ============================================================================
// Memoization Cache
// ============================================================================

let settingsCache: ReminderSettings | null = null;
let sitesCache: SiteEntry[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_TTL;
}

function invalidateCache(): void {
  settingsCache = null;
  sitesCache = null;
  cacheTimestamp = 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract hostname from URL
 */
function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Check if a timestamp is from today
 */
function isToday(timestamp: number | null): boolean {
  if (timestamp === null) return false;
  const today = new Date();
  const date = new Date(timestamp);
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
}

/**
 * Get the appropriate Chrome storage area
 */
function getStorageArea(area: StorageArea): chrome.storage.StorageArea {
  return area === 'sync' ? chrome.storage.sync : chrome.storage.local;
}

// ============================================================================
// Storage Helper Functions
// ============================================================================

/**
 * Get all saved sites from storage
 *
 * @param area - Storage area to use ('sync' or 'local')
 * @returns Promise resolving to array of site entries
 */
export async function getSites(area: StorageArea = 'sync'): Promise<SiteEntry[]> {
  // Check cache first
  if (sitesCache !== null && isCacheValid()) {
    return sitesCache;
  }

  const storage = getStorageArea(area);

  return new Promise((resolve, reject) => {
    storage.get([STORAGE_KEYS.SITES], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const sites: SiteEntry[] = result[STORAGE_KEYS.SITES] ?? DEFAULT_STORAGE.sites;

      // Update status flags based on timestamps
      const updatedSites = sites.map((site) => ({
        ...site,
        visitedStatus: isToday(site.lastVisitedAt),
        checkedInStatus: isToday(site.lastCheckedInAt),
      }));

      // Update cache
      sitesCache = updatedSites;
      cacheTimestamp = Date.now();

      resolve(updatedSites);
    });
  });
}

/**
 * Get a single site by ID
 *
 * @param id - Site ID to find
 * @param area - Storage area to use
 * @returns Promise resolving to site entry or null if not found
 */
export async function getSiteById(
  id: string,
  area: StorageArea = 'sync'
): Promise<SiteEntry | null> {
  const sites = await getSites(area);
  return sites.find((site) => site.id === id) ?? null;
}

/**
 * Get a site by URL (for duplicate detection)
 *
 * @param url - URL to search for
 * @param area - Storage area to use
 * @returns Promise resolving to site entry or null if not found
 */
export async function getSiteByUrl(
  url: string,
  area: StorageArea = 'sync'
): Promise<SiteEntry | null> {
  const sites = await getSites(area);
  const hostname = extractHostname(url);
  return sites.find((site) => site.hostname === hostname) ?? null;
}

/**
 * Add a new site to storage
 *
 * @param input - Site data to add
 * @param area - Storage area to use
 * @returns Promise resolving to the created site entry
 * @throws Error if site with same URL already exists
 */
export async function addSite(input: AddSiteInput, area: StorageArea = 'sync'): Promise<SiteEntry> {
  const storage = getStorageArea(area);
  const sites = await getSites(area);

  // Check for duplicates
  const hostname = extractHostname(input.url);
  const existing = sites.find((site) => site.hostname === hostname);

  if (existing) {
    throw new Error(`Site with hostname "${hostname}" already exists`);
  }

  const now = Date.now();
  const newSite: SiteEntry = {
    id: generateId(),
    title: input.title,
    url: input.url,
    hostname,
    favicon: input.favicon ?? '',
    notes: input.notes,
    tags: input.tags ?? [],
    visitedStatus: false,
    checkedInStatus: false,
    lastVisitedAt: null,
    lastCheckedInAt: null,
    checkInHistory: [],
    frequency: input.frequency ?? 'daily',
    autoDetect: input.autoDetect ?? true,
    reminderEnabled: input.reminderEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const updatedSites = [...sites, newSite];

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SITES]: updatedSites }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(newSite);
    });
  });
}

/**
 * Update the status of a site (visited or checked-in)
 *
 * @param id - Site ID to update
 * @param statusType - Type of status to update ('visited' or 'checkedIn')
 * @param value - Optional boolean value (defaults to true)
 * @param area - Storage area to use
 * @returns Promise resolving to the updated site entry
 * @throws Error if site not found
 */
export async function updateStatus(
  id: string,
  statusType: StatusType,
  value = true,
  area: StorageArea = 'sync'
): Promise<SiteEntry> {
  const storage = getStorageArea(area);
  const sites = await getSites(area);

  const siteIndex = sites.findIndex((site) => site.id === id);
  if (siteIndex === -1) {
    throw new Error(`Site with id "${id}" not found`);
  }

  const now = Date.now();
  const site = sites[siteIndex];

  const updatedSite: SiteEntry = {
    ...site,
    updatedAt: now,
  };

  if (statusType === 'visited') {
    updatedSite.visitedStatus = value;
    if (value) {
      updatedSite.lastVisitedAt = now;
      updatedSite.checkInHistory = [...site.checkInHistory, { timestamp: now, type: 'visit' }];
    }
  } else if (statusType === 'checkedIn') {
    updatedSite.checkedInStatus = value;
    if (value) {
      updatedSite.lastCheckedInAt = now;
      updatedSite.checkInHistory = [...site.checkInHistory, { timestamp: now, type: 'manual' }];
    }
  }

  const updatedSites = [...sites.slice(0, siteIndex), updatedSite, ...sites.slice(siteIndex + 1)];

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SITES]: updatedSites }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(updatedSite);
    });
  });
}

/**
 * Update a site entry with new data
 *
 * @param id - Site ID to update
 * @param updates - Partial site data to update
 * @param area - Storage area to use
 * @returns Promise resolving to the updated site entry
 * @throws Error if site not found
 */
export async function updateSite(
  id: string,
  updates: UpdateSiteInput,
  area: StorageArea = 'sync'
): Promise<SiteEntry> {
  const storage = getStorageArea(area);
  const sites = await getSites(area);

  const siteIndex = sites.findIndex((site) => site.id === id);
  if (siteIndex === -1) {
    throw new Error(`Site with id "${id}" not found`);
  }

  const site = sites[siteIndex];
  const now = Date.now();

  // Update hostname if URL is being changed
  let hostname = site.hostname;
  if (updates.url) {
    hostname = extractHostname(updates.url);
    // Check for duplicate hostname (excluding current site)
    const existingWithHostname = sites.find((s) => s.hostname === hostname && s.id !== id);
    if (existingWithHostname) {
      throw new Error(`Site with hostname "${hostname}" already exists`);
    }
  }

  const updatedSite: SiteEntry = {
    ...site,
    ...updates,
    hostname,
    updatedAt: now,
  };

  const updatedSites = [...sites.slice(0, siteIndex), updatedSite, ...sites.slice(siteIndex + 1)];

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SITES]: updatedSites }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(updatedSite);
    });
  });
}

/**
 * Delete a site from storage
 *
 * @param id - Site ID to delete
 * @param area - Storage area to use
 * @returns Promise resolving to true if deleted
 * @throws Error if site not found
 */
export async function deleteSite(id: string, area: StorageArea = 'sync'): Promise<boolean> {
  const storage = getStorageArea(area);
  const sites = await getSites(area);

  const siteIndex = sites.findIndex((site) => site.id === id);
  if (siteIndex === -1) {
    throw new Error(`Site with id "${id}" not found`);
  }

  const updatedSites = [...sites.slice(0, siteIndex), ...sites.slice(siteIndex + 1)];

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SITES]: updatedSites }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(true);
    });
  });
}

/**
 * Get current reminder settings
 *
 * @param area - Storage area to use
 * @returns Promise resolving to reminder settings
 */
export async function getSettings(area: StorageArea = 'sync'): Promise<ReminderSettings> {
  // Check cache first
  if (settingsCache !== null && isCacheValid()) {
    return settingsCache;
  }

  const storage = getStorageArea(area);

  return new Promise((resolve, reject) => {
    storage.get([STORAGE_KEYS.SETTINGS], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const settings: ReminderSettings = {
        ...DEFAULT_REMINDER_SETTINGS,
        ...(result[STORAGE_KEYS.SETTINGS] ?? {}),
      };

      // Update cache
      settingsCache = settings;
      cacheTimestamp = Date.now();

      resolve(settings);
    });
  });
}

/**
 * Update reminder settings
 *
 * @param updates - Partial settings to update
 * @param area - Storage area to use
 * @returns Promise resolving to the updated settings
 */
export async function updateSettings(
  updates: Partial<ReminderSettings>,
  area: StorageArea = 'sync'
): Promise<ReminderSettings> {
  const storage = getStorageArea(area);
  const currentSettings = await getSettings(area);

  const updatedSettings: ReminderSettings = {
    ...currentSettings,
    ...updates,
  };

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SETTINGS]: updatedSettings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(updatedSettings);
    });
  });
}

/**
 * Reset all sites' daily status (called at reset time)
 *
 * @param area - Storage area to use
 * @returns Promise resolving to updated sites
 */
export async function resetDailyStatus(area: StorageArea = 'sync'): Promise<SiteEntry[]> {
  const storage = getStorageArea(area);
  const sites = await getSites(area);

  const updatedSites = sites.map((site) => ({
    ...site,
    visitedStatus: false,
    checkedInStatus: false,
  }));

  return new Promise((resolve, reject) => {
    storage.set({ [STORAGE_KEYS.SITES]: updatedSites }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve(updatedSites);
    });
  });
}

/**
 * Get count of pending (not checked-in) sites
 *
 * @param area - Storage area to use
 * @returns Promise resolving to count of pending sites
 */
export async function getPendingCount(area: StorageArea = 'sync'): Promise<number> {
  const sites = await getSites(area);
  return sites.filter((site) => !site.checkedInStatus).length;
}

// ============================================================================
// Change Listeners
// ============================================================================

/**
 * Listener storage for cleanup
 */
type ListenerCleanup = () => void;

/**
 * Subscribe to sites changes
 *
 * @param callback - Function to call when sites change
 * @param area - Storage area to watch
 * @returns Cleanup function to unsubscribe
 */
export function onSitesChange(
  callback: StorageChangeCallback<SiteEntry[]>,
  area: StorageArea = 'sync'
): ListenerCleanup {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName !== area) return;

    if (STORAGE_KEYS.SITES in changes) {
      const change = changes[STORAGE_KEYS.SITES];

      // Update cached sites with recalculated status
      const newSites = (change.newValue as SiteEntry[] | undefined)?.map((site) => ({
        ...site,
        visitedStatus: isToday(site.lastVisitedAt),
        checkedInStatus: isToday(site.lastCheckedInAt),
      }));

      const oldSites = (change.oldValue as SiteEntry[] | undefined)?.map((site) => ({
        ...site,
        visitedStatus: isToday(site.lastVisitedAt),
        checkedInStatus: isToday(site.lastCheckedInAt),
      }));

      // Invalidate cache on external changes
      invalidateCache();

      callback(newSites, oldSites);
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Subscribe to settings changes
 *
 * @param callback - Function to call when settings change
 * @param area - Storage area to watch
 * @returns Cleanup function to unsubscribe
 */
export function onSettingsChange(
  callback: StorageChangeCallback<ReminderSettings>,
  area: StorageArea = 'sync'
): ListenerCleanup {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
    if (areaName !== area) return;

    if (STORAGE_KEYS.SETTINGS in changes) {
      const change = changes[STORAGE_KEYS.SETTINGS];

      // Invalidate cache on external changes
      invalidateCache();

      callback(
        change.newValue as ReminderSettings | undefined,
        change.oldValue as ReminderSettings | undefined
      );
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Clear all storage data (for testing or reset)
 *
 * @param area - Storage area to clear
 * @returns Promise resolving when complete
 */
export async function clearAllData(area: StorageArea = 'sync'): Promise<void> {
  const storage = getStorageArea(area);

  return new Promise((resolve, reject) => {
    storage.clear(() => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Invalidate cache
      invalidateCache();

      resolve();
    });
  });
}

// Export cache functions for testing
export const _testUtils = {
  invalidateCache,
  isCacheValid,
  isToday,
  extractHostname,
};
