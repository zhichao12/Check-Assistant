# Runtime Messaging Documentation

This document describes the runtime messaging system used for communication between the different components of the 签到助手 Chrome extension.

## Overview

The extension uses Chrome's `chrome.runtime.sendMessage` API for inter-component communication. All messages follow a standard format and responses are handled asynchronously.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Message Flow Overview                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐                 ┌──────────────────────────────────┐   │
│  │   POPUP UI   │ ───────────────►│                                  │   │
│  │   (React)    │◄─────────────── │                                  │   │
│  └──────────────┘                 │                                  │   │
│                                   │    BACKGROUND SERVICE WORKER     │   │
│  ┌──────────────┐                 │                                  │   │
│  │ OPTIONS PAGE │ ───────────────►│    - Message Router              │   │
│  │   (React)    │◄─────────────── │    - Alarm Handler               │   │
│  └──────────────┘                 │    - Notification Manager        │   │
│                                   │    - Storage Manager             │   │
│  ┌──────────────┐                 │                                  │   │
│  │   CONTENT    │ ───────────────►│                                  │   │
│  │   SCRIPT     │◄─────────────── │                                  │   │
│  └──────────────┘                 └──────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Message Format

### Request

```typescript
interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}
```

### Response

```typescript
interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Message Types

### Site Management

| Type | Direction | Payload | Response | Description |
|------|-----------|---------|----------|-------------|
| `GET_SITES` | Popup/Options → Background | None | `SiteEntry[]` | Retrieve all saved sites |
| `SAVE_SITE` | Popup → Background | `AddSiteInput` | `SiteEntry` | Save a new site |
| `UPDATE_SITE` | Popup → Background | `{id, updates}` | `SiteEntry` | Update an existing site |
| `DELETE_SITE` | Popup → Background | `string` (site ID) | None | Delete a site |
| `MARK_VISITED` | Popup → Background | `string` (site ID) | `SiteEntry` | Mark site as visited |
| `MARK_CHECKED_IN` | Popup → Background | `string` (site ID) | `SiteEntry` | Mark site as checked in |

### Settings Management

| Type | Direction | Payload | Response | Description |
|------|-----------|---------|----------|-------------|
| `GET_SETTINGS` | Any → Background | None | `ReminderSettings` | Get user settings |
| `UPDATE_SETTINGS` | Options → Background | `Partial<ReminderSettings>` | `ReminderSettings` | Update settings |

### Content Script Messages

| Type | Direction | Payload | Response | Description |
|------|-----------|---------|----------|-------------|
| `CHECK_URL_MATCH` | Content → Background | `{url}` | `UrlMatchResult` | Check if URL matches saved site |
| `SITE_VISITED` | Content → Background | `SiteVisitedPayload` | `SiteEntry` | Notify of site visit |

### Bulk Operations

| Type | Direction | Payload | Response | Description |
|------|-----------|---------|----------|-------------|
| `CLEAR_ALL_SITES` | Options → Background | None | None | Delete all saved sites |
| `RESET_ALL_STATUS` | Options → Background | None | `SiteEntry[]` | Reset daily status for all sites |

### Control Messages

| Type | Direction | Payload | Response | Description |
|------|-----------|---------|----------|-------------|
| `OPEN_POPUP` | Background → Popup | None | None | Open the extension popup |

## Usage Examples

### Popup: Get All Sites

```typescript
import type { Message, MessageResponse, SiteEntry } from '@/shared/types';

async function loadSites(): Promise<SiteEntry[]> {
  const response = await chrome.runtime.sendMessage<Message, MessageResponse<SiteEntry[]>>({
    type: 'GET_SITES',
  });

  if (response.success && response.data) {
    return response.data;
  }

  throw new Error(response.error || 'Failed to load sites');
}
```

### Popup: Save a Site

```typescript
async function saveSite(url: string, title: string): Promise<SiteEntry> {
  const response = await chrome.runtime.sendMessage({
    type: 'SAVE_SITE',
    payload: { url, title },
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data;
}
```

### Content Script: Check URL Match

```typescript
async function checkCurrentUrl(): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_URL_MATCH',
    payload: { url: window.location.href },
  });

  if (response.success && response.data?.matched) {
    console.log(`Matched site: ${response.data.siteName}`);
  }
}
```

### Options: Update Settings

```typescript
async function updateTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
  const response = await chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    payload: { theme },
  });

  if (!response.success) {
    throw new Error(response.error);
  }
}
```

## Background Service Worker: Handling Messages

The background service worker registers a message listener that routes all incoming messages:

```typescript
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate async response
    return true;
  }
);
```

## Notification Actions

When a notification is shown, users can interact with it via buttons. The background service worker handles these actions:

### Reminder Notification Buttons

1. **"查看列表"** (Button 0) - Opens the extension popup
2. **"稍后提醒"** (Button 1) - Snoozes the reminder for the configured duration

### Site Visit Notification Buttons

1. **"标记已签到"** (Button 0) - Marks the site as checked in
2. **"仅已访问"** (Button 1) - Keeps it as visited only (no action needed)

## Error Handling

All message handlers follow a consistent error handling pattern:

1. Wrap operations in try/catch
2. Return `{ success: false, error: message }` on failure
3. Log errors for debugging
4. Never throw from message handlers (would cause unhandled rejection)

Example:

```typescript
async function handleGetSites(): Promise<MessageResponse<SiteEntry[]>> {
  try {
    const sites = await getSites();
    return { success: true, data: sites };
  } catch (error) {
    console.error('Failed to get sites:', error);
    return { success: false, error: (error as Error).message };
  }
}
```

## Storage Change Listeners

Components can also subscribe to storage changes for real-time updates:

```typescript
import { onSitesChange, onSettingsChange } from '@/lib/storage';

// Subscribe to site changes
const unsubscribe = onSitesChange((newSites, oldSites) => {
  console.log('Sites changed:', { newSites, oldSites });
});

// Later: unsubscribe when done
unsubscribe();
```

## Best Practices

1. **Always check `response.success`** before using `response.data`
2. **Handle errors gracefully** - show user-friendly messages
3. **Use TypeScript generics** for type-safe messaging
4. **Log messages** in development for debugging
5. **Return true from message listeners** if using async handlers
6. **Use the storage layer** (`@/lib/storage`) instead of direct `chrome.storage` access
