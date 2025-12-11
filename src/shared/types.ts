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
 */
export type MessageType =
  | 'SAVE_SITE'
  | 'GET_SITES'
  | 'UPDATE_SITE'
  | 'DELETE_SITE'
  | 'MARK_VISITED'
  | 'SITE_VISITED'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS';

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
 * Storage keys
 */
export const STORAGE_KEYS = {
  SITES: 'sites',
  SETTINGS: 'settings',
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
