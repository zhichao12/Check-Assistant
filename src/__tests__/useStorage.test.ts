import { describe, it, expect, beforeEach, vi, afterEach, type MockInstance } from 'vitest';
import { mockChrome } from './setup';
import { StorageService } from '@/lib/hooks/useStorage';
import { STORAGE_KEYS, DEFAULT_REMINDER_SETTINGS, _testUtils, type SiteEntry } from '@/lib/storage';

// Note: useStorage hook tests would require @testing-library/react
// For now, we test the StorageService class which demonstrates the add/update flows

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

describe('StorageService', () => {
  let service: StorageService;
  let consoleSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    _testUtils.invalidateCache();
    service = new StorageService('sync');

    // Spy on console.log to verify demo outputs
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('demoAddAndVisit', () => {
    it('should add a site and mark it as visited', async () => {
      // Setup mock for get (returns empty initially)
      mockChrome.storage.sync.get.mockImplementation(
        (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ [STORAGE_KEYS.SITES]: [] });
        }
      );

      // Track set calls to return updated data
      let storedSites: SiteEntry[] = [];
      mockChrome.storage.sync.set.mockImplementation(
        (data: Record<string, unknown>, callback: () => void) => {
          if (data[STORAGE_KEYS.SITES]) {
            storedSites = data[STORAGE_KEYS.SITES] as SiteEntry[];
          }
          // Update get mock to return new data
          mockChrome.storage.sync.get.mockImplementation(
            (_keys: unknown, cb: (items: Record<string, unknown>) => void) => {
              cb({ [STORAGE_KEYS.SITES]: storedSites });
            }
          );
          callback();
        }
      );

      const result = await service.demoAddAndVisit('Demo Site', 'https://demo.example.com');

      expect(result.added).toBeDefined();
      expect(result.added.title).toBe('Demo Site');
      expect(result.added.url).toBe('https://demo.example.com');

      expect(result.visited).toBeDefined();
      expect(result.visited.visitedStatus).toBe(true);
      expect(result.visited.lastVisitedAt).toBeDefined();

      // Verify console logs
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StorageService] Added site:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StorageService] Marked as visited:')
      );
    });
  });

  describe('demoUpdateAndCheckIn', () => {
    it('should update title and check in', async () => {
      const existingSite = createMockSite({ id: 'existing-id' });

      mockChrome.storage.sync.get.mockImplementation(
        (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ [STORAGE_KEYS.SITES]: [existingSite] });
        }
      );

      let storedSites = [existingSite];
      mockChrome.storage.sync.set.mockImplementation(
        (data: Record<string, unknown>, callback: () => void) => {
          if (data[STORAGE_KEYS.SITES]) {
            storedSites = data[STORAGE_KEYS.SITES] as SiteEntry[];
          }
          mockChrome.storage.sync.get.mockImplementation(
            (_keys: unknown, cb: (items: Record<string, unknown>) => void) => {
              cb({ [STORAGE_KEYS.SITES]: storedSites });
            }
          );
          callback();
        }
      );

      const result = await service.demoUpdateAndCheckIn('existing-id', 'New Title');

      expect(result.updated.title).toBe('New Title');
      expect(result.checkedIn.checkedInStatus).toBe(true);
      expect(result.checkedIn.lastCheckedInAt).toBeDefined();
    });
  });

  describe('demoCrudFlow', () => {
    it('should complete full CRUD cycle', async () => {
      mockChrome.storage.sync.get.mockImplementation(
        (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ [STORAGE_KEYS.SITES]: [] });
        }
      );

      let storedSites: SiteEntry[] = [];
      mockChrome.storage.sync.set.mockImplementation(
        (data: Record<string, unknown>, callback: () => void) => {
          if (data[STORAGE_KEYS.SITES]) {
            storedSites = data[STORAGE_KEYS.SITES] as SiteEntry[];
          }
          mockChrome.storage.sync.get.mockImplementation(
            (_keys: unknown, cb: (items: Record<string, unknown>) => void) => {
              cb({ [STORAGE_KEYS.SITES]: storedSites });
            }
          );
          callback();
        }
      );

      await service.demoCrudFlow();

      // Verify the flow completed (site was deleted at the end)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StorageService] Starting CRUD demo...')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[StorageService] Created:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[StorageService] Deleted:'));
      expect(consoleSpy).toHaveBeenCalledWith('[StorageService] CRUD demo completed');
    });
  });

  describe('demoSettingsFlow', () => {
    it('should update and restore settings', async () => {
      mockChrome.storage.sync.get.mockImplementation(
        (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ [STORAGE_KEYS.SETTINGS]: DEFAULT_REMINDER_SETTINGS });
        }
      );

      mockChrome.storage.sync.set.mockImplementation((_data: unknown, callback: () => void) => {
        callback();
      });

      await service.demoSettingsFlow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StorageService] Starting settings demo...')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[StorageService] Current theme:')
      );
      expect(consoleSpy).toHaveBeenCalledWith('[StorageService] Settings demo completed');
    });
  });
});

// Test useStorage hook - this requires @testing-library/react
// Leaving as placeholder since we'd need to add that dependency
describe('useStorage hook', () => {
  it.skip('should initialize with loading state', () => {
    // Would need @testing-library/react to test this properly
    // Example of how it would look:
    // const { result } = renderHook(() => useStorage());
    // expect(result.current.isLoading).toBe(true);
  });

  it.skip('should load sites and settings', () => {
    // Would need @testing-library/react
  });

  it.skip('should handle add site operation', () => {
    // Would need @testing-library/react
  });
});
