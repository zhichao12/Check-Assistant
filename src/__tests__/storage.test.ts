import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockChrome } from './setup';
import {
  getSites,
  getSiteById,
  getSiteByUrl,
  addSite,
  updateStatus,
  updateSite,
  deleteSite,
  getSettings,
  updateSettings,
  resetDailyStatus,
  getPendingCount,
  onSitesChange,
  onSettingsChange,
  clearAllData,
  DEFAULT_REMINDER_SETTINGS,
  STORAGE_KEYS,
  _testUtils,
  type SiteEntry,
  type ReminderSettings,
  type AddSiteInput,
} from '@/lib/storage';

// Sample test data
const createMockSite = (overrides: Partial<SiteEntry> = {}): SiteEntry => {
  const now = Date.now();
  return {
    id: 'test-site-1',
    title: 'Test Site',
    url: 'https://example.com',
    hostname: 'example.com',
    favicon: 'https://example.com/favicon.ico',
    notes: '',
    tags: [],
    visitedStatus: false,
    checkedInStatus: false,
    lastVisitedAt: null,
    lastCheckedInAt: null,
    checkInHistory: [],
    frequency: 'daily',
    autoDetect: true,
    reminderEnabled: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

const createMockSettings = (overrides: Partial<ReminderSettings> = {}): ReminderSettings => ({
  ...DEFAULT_REMINDER_SETTINGS,
  ...overrides,
});

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Invalidate cache before each test
    _testUtils.invalidateCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSites', () => {
    it('should return empty array when no sites exist', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({});
      });

      const sites = await getSites();

      expect(sites).toEqual([]);
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(
        [STORAGE_KEYS.SITES],
        expect.any(Function)
      );
    });

    it('should return sites from storage', async () => {
      const mockSite = createMockSite();
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });

      const sites = await getSites();

      expect(sites).toHaveLength(1);
      expect(sites[0].id).toBe(mockSite.id);
      expect(sites[0].title).toBe(mockSite.title);
    });

    it('should update visitedStatus based on timestamps', async () => {
      const today = Date.now();
      const yesterday = today - 24 * 60 * 60 * 1000;

      const mockSites = [
        createMockSite({ id: '1', lastVisitedAt: today }),
        createMockSite({ id: '2', lastVisitedAt: yesterday }),
      ];

      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: mockSites });
      });

      const sites = await getSites();

      expect(sites[0].visitedStatus).toBe(true);
      expect(sites[1].visitedStatus).toBe(false);
    });

    it('should reject on chrome runtime error', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        Object.defineProperty(chrome.runtime, 'lastError', {
          value: { message: 'Test error' },
          configurable: true,
        });
        callback({});
        Object.defineProperty(chrome.runtime, 'lastError', {
          value: undefined,
          configurable: true,
        });
      });

      await expect(getSites()).rejects.toThrow('Test error');
    });

    it('should use local storage when specified', async () => {
      mockChrome.storage.local.get = vi.fn(
        (_keys: unknown, callback: (items: Record<string, unknown>) => void) => callback({})
      );

      await getSites('local');

      expect(mockChrome.storage.local.get).toHaveBeenCalled();
    });
  });

  describe('getSiteById', () => {
    it('should return site when found', async () => {
      const mockSite = createMockSite({ id: 'unique-id' });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });

      const site = await getSiteById('unique-id');

      expect(site).not.toBeNull();
      expect(site?.id).toBe('unique-id');
    });

    it('should return null when site not found', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [] });
      });

      const site = await getSiteById('non-existent');

      expect(site).toBeNull();
    });
  });

  describe('getSiteByUrl', () => {
    it('should find site by hostname', async () => {
      const mockSite = createMockSite({
        url: 'https://example.com/page',
        hostname: 'example.com',
      });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });

      const site = await getSiteByUrl('https://example.com/different-page');

      expect(site).not.toBeNull();
      expect(site?.hostname).toBe('example.com');
    });
  });

  describe('addSite', () => {
    it('should add a new site to storage', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const input: AddSiteInput = {
        title: 'New Site',
        url: 'https://newsite.com',
        favicon: 'https://newsite.com/favicon.ico',
      };

      const result = await addSite(input);

      expect(result.title).toBe('New Site');
      expect(result.url).toBe('https://newsite.com');
      expect(result.hostname).toBe('newsite.com');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });

    it('should throw error for duplicate hostname', async () => {
      const existingSite = createMockSite({
        url: 'https://example.com',
        hostname: 'example.com',
      });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [existingSite] });
      });

      const input: AddSiteInput = {
        title: 'Duplicate',
        url: 'https://example.com/other',
      };

      await expect(addSite(input)).rejects.toThrow('already exists');
    });

    it('should use default values for optional fields', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const input: AddSiteInput = {
        title: 'Minimal Site',
        url: 'https://minimal.com',
      };

      const result = await addSite(input);

      expect(result.favicon).toBe('');
      expect(result.frequency).toBe('daily');
      expect(result.autoDetect).toBe(true);
      expect(result.reminderEnabled).toBe(true);
      expect(result.tags).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update visited status', async () => {
      const mockSite = createMockSite();
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateStatus(mockSite.id, 'visited');

      expect(result.visitedStatus).toBe(true);
      expect(result.lastVisitedAt).toBeDefined();
      expect(result.checkInHistory).toHaveLength(1);
      expect(result.checkInHistory[0].type).toBe('visit');
    });

    it('should update checkedIn status', async () => {
      const mockSite = createMockSite();
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateStatus(mockSite.id, 'checkedIn');

      expect(result.checkedInStatus).toBe(true);
      expect(result.lastCheckedInAt).toBeDefined();
      expect(result.checkInHistory).toHaveLength(1);
      expect(result.checkInHistory[0].type).toBe('manual');
    });

    it('should throw error when site not found', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [] });
      });

      await expect(updateStatus('non-existent', 'visited')).rejects.toThrow('not found');
    });
  });

  describe('updateSite', () => {
    it('should update site fields', async () => {
      // Create site with past timestamp to ensure updatedAt is greater
      const pastTime = Date.now() - 1000;
      const mockSite = createMockSite({
        createdAt: pastTime,
        updatedAt: pastTime,
      });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateSite(mockSite.id, {
        title: 'Updated Title',
        notes: 'New notes',
      });

      expect(result.title).toBe('Updated Title');
      expect(result.notes).toBe('New notes');
      expect(result.updatedAt).toBeGreaterThan(mockSite.updatedAt);
    });

    it('should update hostname when URL changes', async () => {
      const mockSite = createMockSite({
        url: 'https://old.com',
        hostname: 'old.com',
      });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateSite(mockSite.id, {
        url: 'https://new.com/page',
      });

      expect(result.url).toBe('https://new.com/page');
      expect(result.hostname).toBe('new.com');
    });

    it('should throw error for duplicate hostname on URL change', async () => {
      const sites = [
        createMockSite({ id: '1', url: 'https://site1.com', hostname: 'site1.com' }),
        createMockSite({ id: '2', url: 'https://site2.com', hostname: 'site2.com' }),
      ];
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: sites });
      });

      await expect(updateSite('1', { url: 'https://site2.com/other' })).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('deleteSite', () => {
    it('should remove site from storage', async () => {
      const mockSite = createMockSite();
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [mockSite] });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await deleteSite(mockSite.id);

      expect(result).toBe(true);

      const setCall = mockChrome.storage.sync.set.mock.calls[0][0];
      expect(setCall[STORAGE_KEYS.SITES]).toHaveLength(0);
    });

    it('should throw error when site not found', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: [] });
      });

      await expect(deleteSite('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({});
      });

      const settings = await getSettings();

      expect(settings).toEqual(DEFAULT_REMINDER_SETTINGS);
    });

    it('should return stored settings', async () => {
      const storedSettings = createMockSettings({ theme: 'dark', enabled: true });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SETTINGS]: storedSettings });
      });

      const settings = await getSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.enabled).toBe(true);
    });

    it('should merge with defaults for partial settings', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SETTINGS]: { theme: 'dark' } });
      });

      const settings = await getSettings();

      expect(settings.theme).toBe('dark');
      expect(settings.snoozeMinutes).toBe(DEFAULT_REMINDER_SETTINGS.snoozeMinutes);
    });
  });

  describe('updateSettings', () => {
    it('should update settings in storage', async () => {
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SETTINGS]: DEFAULT_REMINDER_SETTINGS });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateSettings({ theme: 'dark', enabled: true });

      expect(result.theme).toBe('dark');
      expect(result.enabled).toBe(true);
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });

    it('should preserve existing settings', async () => {
      const existingSettings = createMockSettings({ snoozeMinutes: 15 });
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SETTINGS]: existingSettings });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await updateSettings({ theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(result.snoozeMinutes).toBe(15);
    });
  });

  describe('resetDailyStatus', () => {
    it('should reset visited and checkedIn status for all sites', async () => {
      const sites = [
        createMockSite({ id: '1', visitedStatus: true, checkedInStatus: true }),
        createMockSite({ id: '2', visitedStatus: true, checkedInStatus: false }),
      ];
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: sites });
      });
      mockChrome.storage.sync.set.mockImplementation((_data, callback) => {
        callback();
      });

      const result = await resetDailyStatus();

      expect(result).toHaveLength(2);
      expect(result[0].visitedStatus).toBe(false);
      expect(result[0].checkedInStatus).toBe(false);
      expect(result[1].visitedStatus).toBe(false);
      expect(result[1].checkedInStatus).toBe(false);
    });
  });

  describe('getPendingCount', () => {
    it('should return count of unchecked sites', async () => {
      const sites = [
        createMockSite({ id: '1', checkedInStatus: true }),
        createMockSite({ id: '2', checkedInStatus: false }),
        createMockSite({ id: '3', checkedInStatus: false }),
      ];
      // Mock to return sites with their status preserved for pending calculation
      mockChrome.storage.sync.get.mockImplementation((_keys, callback) => {
        callback({ [STORAGE_KEYS.SITES]: sites });
      });

      const count = await getPendingCount();

      // Note: getSites recalculates status based on timestamps, so all will be false
      // because lastCheckedInAt is null
      expect(count).toBe(3);
    });
  });

  describe('onSitesChange', () => {
    it('should register listener and call callback on changes', () => {
      const callback = vi.fn();

      const cleanup = onSitesChange(callback);

      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();

      // Simulate storage change
      const listener = mockChrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = {
        [STORAGE_KEYS.SITES]: {
          newValue: [createMockSite()],
          oldValue: [],
        },
      };

      listener(changes, 'sync');

      expect(callback).toHaveBeenCalled();

      // Test cleanup
      cleanup();
      // Note: removeListener should be called, but in our mock setup it would need to be verified differently
    });

    it('should ignore changes from different storage area', () => {
      const callback = vi.fn();

      onSitesChange(callback, 'sync');

      const listener = mockChrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = {
        [STORAGE_KEYS.SITES]: {
          newValue: [createMockSite()],
          oldValue: [],
        },
      };

      listener(changes, 'local');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onSettingsChange', () => {
    it('should register listener and call callback on settings changes', () => {
      const callback = vi.fn();

      onSettingsChange(callback);

      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();

      const listener = mockChrome.storage.onChanged.addListener.mock.calls[0][0];
      const changes = {
        [STORAGE_KEYS.SETTINGS]: {
          newValue: createMockSettings({ theme: 'dark' }),
          oldValue: createMockSettings(),
        },
      };

      listener(changes, 'sync');

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('should clear storage', async () => {
      mockChrome.storage.sync.clear = vi.fn((callback) => {
        callback();
      });

      await clearAllData();

      expect(mockChrome.storage.sync.clear).toHaveBeenCalled();
    });
  });

  describe('_testUtils', () => {
    describe('isToday', () => {
      it('should return true for today timestamp', () => {
        expect(_testUtils.isToday(Date.now())).toBe(true);
      });

      it('should return false for yesterday timestamp', () => {
        const yesterday = Date.now() - 24 * 60 * 60 * 1000;
        expect(_testUtils.isToday(yesterday)).toBe(false);
      });

      it('should return false for null', () => {
        expect(_testUtils.isToday(null)).toBe(false);
      });
    });

    describe('extractHostname', () => {
      it('should extract hostname from valid URL', () => {
        expect(_testUtils.extractHostname('https://example.com/path')).toBe('example.com');
      });

      it('should return original string for invalid URL', () => {
        expect(_testUtils.extractHostname('not-a-url')).toBe('not-a-url');
      });
    });
  });
});
