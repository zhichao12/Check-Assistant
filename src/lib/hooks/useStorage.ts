/**
 * Demo hook for storage layer - demonstrates add/update flows
 * This hook provides a React-friendly interface to the storage layer
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSites,
  addSite,
  updateSite,
  updateStatus,
  deleteSite,
  getSettings,
  updateSettings,
  onSitesChange,
  onSettingsChange,
  type SiteEntry,
  type ReminderSettings,
  type AddSiteInput,
  type UpdateSiteInput,
  type StatusType,
  type StorageArea,
} from '@/lib/storage';

/**
 * Hook state interface
 */
interface UseStorageState {
  sites: SiteEntry[];
  settings: ReminderSettings | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook return interface
 */
interface UseStorageReturn extends UseStorageState {
  // Site operations
  addNewSite: (input: AddSiteInput) => Promise<SiteEntry | null>;
  updateSiteData: (id: string, updates: UpdateSiteInput) => Promise<SiteEntry | null>;
  markSiteStatus: (id: string, statusType: StatusType) => Promise<SiteEntry | null>;
  removeSite: (id: string) => Promise<boolean>;

  // Settings operations
  updateUserSettings: (updates: Partial<ReminderSettings>) => Promise<ReminderSettings | null>;

  // Utility
  refresh: () => Promise<void>;
  clearError: () => void;

  // Computed values
  pendingCount: number;
  completedCount: number;
}

/**
 * Custom hook for managing storage state with automatic synchronization
 *
 * @param area - Storage area to use ('sync' or 'local')
 * @returns Storage state and operations
 *
 * @example
 * ```tsx
 * function SiteManager() {
 *   const {
 *     sites,
 *     settings,
 *     isLoading,
 *     error,
 *     addNewSite,
 *     markSiteStatus,
 *     pendingCount
 *   } = useStorage();
 *
 *   const handleAddSite = async () => {
 *     const site = await addNewSite({
 *       title: 'Daily Rewards',
 *       url: 'https://example.com/rewards'
 *     });
 *     if (site) {
 *       console.log('Added site:', site.id);
 *     }
 *   };
 *
 *   const handleCheckIn = async (siteId: string) => {
 *     await markSiteStatus(siteId, 'checkedIn');
 *   };
 *
 *   return (
 *     <div>
 *       <p>Pending: {pendingCount}</p>
 *       {sites.map(site => (
 *         <div key={site.id}>
 *           {site.title}
 *           <button onClick={() => handleCheckIn(site.id)}>
 *             Check In
 *           </button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStorage(area: StorageArea = 'sync'): UseStorageReturn {
  const [state, setState] = useState<UseStorageState>({
    sites: [],
    settings: null,
    isLoading: true,
    error: null,
  });

  /**
   * Load initial data from storage
   */
  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const [sites, settings] = await Promise.all([getSites(area), getSettings(area)]);

      setState({
        sites,
        settings,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, [area]);

  /**
   * Set up change listeners and load initial data
   */
  useEffect(() => {
    loadData();

    // Subscribe to storage changes
    const unsubscribeSites = onSitesChange((newSites) => {
      if (newSites) {
        setState((prev) => ({ ...prev, sites: newSites }));
      }
    }, area);

    const unsubscribeSettings = onSettingsChange((newSettings) => {
      if (newSettings) {
        setState((prev) => ({ ...prev, settings: newSettings }));
      }
    }, area);

    return () => {
      unsubscribeSites();
      unsubscribeSettings();
    };
  }, [area, loadData]);

  /**
   * Add a new site
   */
  const addNewSite = useCallback(
    async (input: AddSiteInput): Promise<SiteEntry | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const site = await addSite(input, area);
        return site;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add site';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [area]
  );

  /**
   * Update site data
   */
  const updateSiteData = useCallback(
    async (id: string, updates: UpdateSiteInput): Promise<SiteEntry | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const site = await updateSite(id, updates, area);
        return site;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update site';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [area]
  );

  /**
   * Mark site as visited or checked-in
   */
  const markSiteStatus = useCallback(
    async (id: string, statusType: StatusType): Promise<SiteEntry | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const site = await updateStatus(id, statusType, true, area);
        return site;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [area]
  );

  /**
   * Remove a site
   */
  const removeSite = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        await deleteSite(id, area);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete site';
        setState((prev) => ({ ...prev, error: message }));
        return false;
      }
    },
    [area]
  );

  /**
   * Update user settings
   */
  const updateUserSettings = useCallback(
    async (updates: Partial<ReminderSettings>): Promise<ReminderSettings | null> => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        const settings = await updateSettings(updates, area);
        return settings;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update settings';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      }
    },
    [area]
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Computed values
  const pendingCount = state.sites.filter((site) => !site.checkedInStatus).length;
  const completedCount = state.sites.filter((site) => site.checkedInStatus).length;

  return {
    ...state,
    addNewSite,
    updateSiteData,
    markSiteStatus,
    removeSite,
    updateUserSettings,
    refresh,
    clearError,
    pendingCount,
    completedCount,
  };
}

/**
 * Simple service class for non-React usage demonstrating storage flows
 * Use this in service workers or vanilla TypeScript contexts
 */
export class StorageService {
  private area: StorageArea;

  constructor(area: StorageArea = 'sync') {
    this.area = area;
  }

  /**
   * Demo: Add a new site and mark it as visited
   */
  async demoAddAndVisit(
    title: string,
    url: string
  ): Promise<{ added: SiteEntry; visited: SiteEntry }> {
    // Step 1: Add the site
    const added = await addSite({ title, url }, this.area);
    console.log(`[StorageService] Added site: ${added.id}`);

    // Step 2: Mark it as visited
    const visited = await updateStatus(added.id, 'visited', true, this.area);
    console.log(`[StorageService] Marked as visited: ${visited.visitedStatus}`);

    return { added, visited };
  }

  /**
   * Demo: Update site title and check in
   */
  async demoUpdateAndCheckIn(
    id: string,
    newTitle: string
  ): Promise<{ updated: SiteEntry; checkedIn: SiteEntry }> {
    // Step 1: Update the title
    const updated = await updateSite(id, { title: newTitle }, this.area);
    console.log(`[StorageService] Updated title to: ${updated.title}`);

    // Step 2: Mark as checked in
    const checkedIn = await updateStatus(id, 'checkedIn', true, this.area);
    console.log(`[StorageService] Marked as checked in: ${checkedIn.checkedInStatus}`);

    return { updated, checkedIn };
  }

  /**
   * Demo: Full CRUD flow
   */
  async demoCrudFlow(): Promise<void> {
    console.log('[StorageService] Starting CRUD demo...');

    // Create
    const site = await addSite(
      {
        title: 'Demo Site',
        url: 'https://demo.example.com',
        notes: 'This is a demo site',
        tags: ['demo', 'test'],
      },
      this.area
    );
    console.log(`[StorageService] Created: ${site.id}`);

    // Read
    const sites = await getSites(this.area);
    console.log(`[StorageService] Total sites: ${sites.length}`);

    // Update status
    const visited = await updateStatus(site.id, 'visited', true, this.area);
    console.log(`[StorageService] Visit recorded at: ${visited.lastVisitedAt}`);

    // Update fields
    const updated = await updateSite(
      site.id,
      {
        title: 'Updated Demo Site',
        notes: 'Updated notes',
      },
      this.area
    );
    console.log(`[StorageService] Updated at: ${updated.updatedAt}`);

    // Delete
    await deleteSite(site.id, this.area);
    console.log(`[StorageService] Deleted: ${site.id}`);

    console.log('[StorageService] CRUD demo completed');
  }

  /**
   * Demo: Settings management
   */
  async demoSettingsFlow(): Promise<void> {
    console.log('[StorageService] Starting settings demo...');

    // Get current settings
    const current = await getSettings(this.area);
    console.log(`[StorageService] Current theme: ${current.theme}`);

    // Update settings
    const updated = await updateSettings(
      {
        theme: 'dark',
        enabled: true,
        autoMarkOnVisit: true,
      },
      this.area
    );
    console.log(`[StorageService] Updated theme: ${updated.theme}`);
    console.log(`[StorageService] Reminders enabled: ${updated.enabled}`);

    // Restore original
    await updateSettings({ theme: current.theme }, this.area);
    console.log('[StorageService] Settings demo completed');
  }
}

export default useStorage;
