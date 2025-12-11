/**
 * Test setup file
 * Mock Chrome APIs for testing
 */

import { vi } from 'vitest';

// Mock chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
    openOptionsPage: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    clearAll: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  action: {
    openPopup: vi.fn(),
  },
};

// @ts-expect-error - Mocking chrome global
globalThis.chrome = mockChrome;

export { mockChrome };
