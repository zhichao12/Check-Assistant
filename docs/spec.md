# 签到助手 (Check-in Assistant) - Chrome Extension Specification

> **Version:** 1.0.0-draft  
> **Last Updated:** December 2024  
> **Status:** Draft for Review

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Stories](#2-user-stories)
3. [Prioritized Scenarios](#3-prioritized-scenarios)
4. [Visual Style Guidelines](#4-visual-style-guidelines)
5. [High-Level Architecture](#5-high-level-architecture)
6. [Interaction Flows](#6-interaction-flows)
7. [Data Model](#7-data-model)
8. [Theming Guidelines](#8-theming-guidelines)
9. [Task Breakdown](#9-task-breakdown)
10. [Future Considerations](#10-future-considerations)

---

## 1. Product Vision

### Overview

**签到助手 (Check-in Assistant)** is a lightweight Chrome extension designed to help users track websites they need to visit regularly for check-ins, daily rewards, or routine tasks. Think of it as a focused bookmark manager specifically for sites requiring periodic visits.

### Problem Statement

Many users need to regularly check in to various websites (forums, reward programs, work portals, etc.) but struggle to:
- Remember all the sites they need to visit
- Track which sites they've already checked today
- Maintain a consistent check-in routine

### Solution

A minimalist Chrome extension that:
- Quickly saves the current tab as a check-in target
- Provides a clean overview of all saved sites
- Tracks visit/check-in status with visual indicators
- Sends optional reminders to ensure no check-in is missed

### Design Philosophy

- **Lightweight**: Fast to open, fast to use
- **Non-intrusive**: Subtle reminders, not aggressive notifications
- **Beautiful**: Clean, modern UI inspired by Todoist and Notion Web Clipper
- **Focused**: Does one thing exceptionally well

---

## 2. User Stories

### Primary User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-01 | User | Save the current tab as a check-in site | I can track it for regular visits | P0 |
| US-02 | User | View all my saved check-in sites | I can see what needs attention today | P0 |
| US-03 | User | Mark a site as visited/checked-in | I know I've completed that task | P0 |
| US-04 | User | Receive reminders for pending check-ins | I don't forget to visit important sites | P1 |
| US-05 | User | Remove sites from my list | I can keep my list clean and relevant | P0 |
| US-06 | User | Categorize/tag my sites | I can organize by type or purpose | P2 |
| US-07 | User | See check-in history/streaks | I can track my consistency | P2 |
| US-08 | User | Switch between light/dark themes | The UI matches my preference | P1 |
| US-09 | User | Quick-open a site from the list | I can navigate efficiently | P0 |
| US-10 | User | Set custom reminder times | Reminders fit my schedule | P1 |

### User Personas

**Primary Persona: "Daily Checker" Chen**
- Visits 5-10 sites daily for rewards/check-ins
- Values efficiency and visual clarity
- Uses Chrome as primary browser
- Prefers dark mode

**Secondary Persona: "Organized Professional" Wang**
- Manages multiple work portals requiring daily login
- Needs clear status indicators
- Values categorization features

---

## 3. Prioritized Scenarios

### 3.1 Saving Current Tab (P0)

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  User clicks extension icon while on target website         │
│                          ↓                                  │
│  Popup opens with current tab info pre-filled               │
│                          ↓                                  │
│  User can optionally add notes/tags                         │
│                          ↓                                  │
│  User clicks "Save" button                                  │
│                          ↓                                  │
│  Site saved to storage with success animation               │
│                          ↓                                  │
│  Popup shows updated list with new site                     │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Current tab URL and title auto-populated
- [ ] Favicon automatically extracted
- [ ] Save completes in < 100ms
- [ ] Success feedback visible
- [ ] Duplicate detection with merge option

### 3.2 Viewing Site List (P0)

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  User clicks extension icon                                 │
│                          ↓                                  │
│  Popup displays site list with status indicators            │
│  ┌─────────────────────────────────────────┐                │
│  │  ☐ Site A (pending)      [🔗] [✓] [⋮]  │                │
│  │  ✓ Site B (done today)   [🔗] [↺] [⋮]  │                │
│  │  ☐ Site C (pending)      [🔗] [✓] [⋮]  │                │
│  └─────────────────────────────────────────┘                │
│                          ↓                                  │
│  User can filter/search or take actions                     │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] List loads in < 200ms
- [ ] Clear visual distinction between pending/completed
- [ ] One-click navigation to site
- [ ] One-click mark as done
- [ ] Search/filter functionality
- [ ] Empty state with helpful guidance

### 3.3 Marking 访问/签到 (Visit/Check-in) (P0)

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  Option A: Manual marking from popup                        │
│  User clicks ✓ button next to site → Status updates         │
│                                                             │
│  Option B: Auto-detection via content script                │
│  User visits saved site → Content script detects visit      │
│                          ↓                                  │
│  Background worker records visit timestamp                  │
│                          ↓                                  │
│  Badge/icon updates to reflect completion                   │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Manual marking with single click
- [ ] Optional auto-detection of visits
- [ ] Timestamp recorded for history
- [ ] Visual status update immediate
- [ ] Undo option available (5 second window)

### 3.4 Receiving 提醒 (Reminders) (P1)

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  User configures reminder time in options                   │
│                          ↓                                  │
│  Background service worker sets Chrome alarm                │
│                          ↓                                  │
│  At scheduled time, alarm fires                             │
│                          ↓                                  │
│  Service worker checks for pending check-ins                │
│                          ↓                                  │
│  If pending items exist:                                    │
│    → Chrome notification displayed                          │
│    → Badge shows pending count                              │
│                          ↓                                  │
│  User clicks notification → Popup opens with list           │
└─────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Configurable reminder times (multiple per day)
- [ ] Smart notifications (only when items pending)
- [ ] Non-intrusive notification style
- [ ] Click notification to open extension
- [ ] Option to snooze reminder
- [ ] Respect system Do Not Disturb settings

---

## 4. Visual Style Guidelines

### Design Inspiration

The UI should emulate the clean, purposeful aesthetic of:

| Reference | Key Elements to Adopt |
|-----------|----------------------|
| **Todoist** | Task completion animations, subtle color accents, efficient use of space |
| **Notion Web Clipper** | Minimal popup design, smooth transitions, floating card aesthetic |

### Design Principles

1. **Minimal Chrome**: Reduce visual clutter, focus on content
2. **Purposeful Animation**: Subtle feedback, not distracting flourishes
3. **Accessible**: WCAG 2.1 AA compliant contrast ratios
4. **Responsive**: Adapts to popup size constraints (min 320px width)

### Typography

```
Primary Font: Inter (fallback: -apple-system, system-ui, sans-serif)
Font Sizes:
  - Heading: 16px / 600 weight
  - Body: 14px / 400 weight
  - Caption: 12px / 400 weight
Line Height: 1.5
```

### Spacing System

```
Base unit: 4px
Scale: 4, 8, 12, 16, 24, 32, 48
```

### Color Palette (See Theming Section for full details)

```
Primary Action: #4F46E5 (Indigo)
Success: #10B981 (Emerald)
Warning: #F59E0B (Amber)
Error: #EF4444 (Red)
```

### Component Styling

```
Border Radius: 8px (cards), 6px (buttons), 4px (inputs)
Shadow (Light): 0 1px 3px rgba(0,0,0,0.1)
Shadow (Dark): 0 1px 3px rgba(0,0,0,0.3)
Transitions: 150ms ease-in-out
```

### Popup Dimensions

```
Width: 360px (fixed)
Min Height: 200px
Max Height: 500px (scrollable content)
```

---

## 5. High-Level Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Extension Manifest | Manifest V3 | Chrome's latest extension platform |
| Background | Service Worker | Required by MV3, event-driven |
| Popup UI | React 18 + TypeScript | Component reusability, type safety |
| Options Page | React 18 + TypeScript | Consistent tech stack |
| Content Script | Vanilla TypeScript | Minimal footprint, fast injection |
| Styling | Tailwind CSS | Rapid development, small bundle |
| State Management | Zustand | Lightweight, TypeScript-friendly |
| Build Tool | Vite | Fast builds, excellent DX |
| Storage | Chrome Storage API | Sync across devices |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension Architecture                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────────────────────────────────────┐   │
│  │   POPUP UI   │    │           BACKGROUND SERVICE WORKER           │   │
│  │   (React)    │◄──►│                                                │   │
│  │              │    │  ┌─────────────┐  ┌─────────────┐             │   │
│  │ • Site List  │    │  │   Alarm     │  │  Message    │             │   │
│  │ • Quick Add  │    │  │   Handler   │  │  Router     │             │   │
│  │ • Status     │    │  └─────────────┘  └─────────────┘             │   │
│  └──────────────┘    │                                                │   │
│         │            │  ┌─────────────┐  ┌─────────────┐             │   │
│         │            │  │ Notification│  │   Storage   │             │   │
│         ▼            │  │   Manager   │  │   Manager   │             │   │
│  ┌──────────────┐    │  └─────────────┘  └─────────────┘             │   │
│  │ OPTIONS PAGE │    │                                                │   │
│  │   (React)    │◄──►│                                                │   │
│  │              │    └──────────────────────────────────────────────┘   │
│  │ • Settings   │                           │                           │
│  │ • Reminders  │                           │                           │
│  │ • Theme      │                           ▼                           │
│  └──────────────┘         ┌─────────────────────────────┐              │
│                           │     CHROME APIS              │              │
│  ┌──────────────┐         │                              │              │
│  │   CONTENT    │         │  • chrome.storage.sync       │              │
│  │   SCRIPT     │◄───────►│  • chrome.tabs               │              │
│  │              │         │  • chrome.alarms             │              │
│  │ • Auto-detect│         │  • chrome.notifications      │              │
│  │ • Visit track│         │  • chrome.runtime            │              │
│  └──────────────┘         └─────────────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

#### Background Service Worker (`background.ts`)
- **Alarm Handler**: Schedule and process reminder alarms
- **Message Router**: Handle messages from popup/content scripts
- **Notification Manager**: Create and manage Chrome notifications
- **Storage Manager**: CRUD operations for site data

#### Popup UI (`popup/`)
- **Site List Component**: Display and manage saved sites
- **Quick Add Component**: Save current tab with one click
- **Status Component**: Today's progress summary
- **Actions**: Mark done, open site, delete, edit

#### Options Page (`options/`)
- **Settings Form**: Reminder times, notification preferences
- **Theme Toggle**: Light/dark mode selection
- **Data Management**: Export/import, clear data

#### Content Script (`content.ts`)
- **Visit Detection**: Detect when user visits a saved site
- **Message Sender**: Notify background of visits

---

## 6. Interaction Flows

### 6.1 Module Communication

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Message Passing Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POPUP → BACKGROUND                                                      │
│  ─────────────────                                                       │
│  chrome.runtime.sendMessage({                                            │
│    type: 'SAVE_SITE',                                                    │
│    payload: { url, title, favicon }                                      │
│  })                                                                      │
│                                                                          │
│  BACKGROUND → POPUP (Response)                                           │
│  ────────────────────────────                                            │
│  { success: true, site: {...} }                                          │
│                                                                          │
│  CONTENT → BACKGROUND                                                    │
│  ────────────────────                                                    │
│  chrome.runtime.sendMessage({                                            │
│    type: 'SITE_VISITED',                                                 │
│    payload: { url, timestamp }                                           │
│  })                                                                      │
│                                                                          │
│  BACKGROUND → POPUP (Broadcast)                                          │
│  ──────────────────────────────                                          │
│  // Popup listens via onMessage or polls storage                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chrome API Integration

#### Storage API Usage

```typescript
// Save site
chrome.storage.sync.set({ sites: [...] })

// Load sites
chrome.storage.sync.get(['sites'], (result) => { ... })

// Listen for changes (for reactive updates)
chrome.storage.onChanged.addListener((changes, area) => { ... })
```

#### Tabs API Usage

```typescript
// Get current tab for quick save
chrome.tabs.query({ active: true, currentWindow: true })

// Open saved site in new tab
chrome.tabs.create({ url: site.url })
```

#### Alarms API Usage

```typescript
// Create reminder alarm
chrome.alarms.create('daily-reminder', {
  when: Date.now() + delayMs,
  periodInMinutes: 1440 // Daily
})

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'daily-reminder') {
    checkAndNotify()
  }
})
```

#### Notifications API Usage

```typescript
// Show reminder notification
chrome.notifications.create('checkin-reminder', {
  type: 'basic',
  iconUrl: 'icons/icon128.png',
  title: '签到提醒',
  message: `还有 ${count} 个网站等待签到`,
  buttons: [{ title: '查看列表' }, { title: '稍后提醒' }]
})

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => { ... })
```

### 6.3 Complete User Flow: Save & Check-in

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    Complete Save & Check-in Flow                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. USER SAVES SITE                                                       │
│  ─────────────────                                                        │
│                                                                           │
│  [Browser Tab] ──click──► [Popup Opens]                                   │
│                               │                                           │
│                               ▼                                           │
│                     chrome.tabs.query()                                   │
│                               │                                           │
│                               ▼                                           │
│                    [Pre-filled Form Shown]                                │
│                               │                                           │
│                          click "Save"                                     │
│                               │                                           │
│                               ▼                                           │
│              chrome.runtime.sendMessage(SAVE_SITE)                        │
│                               │                                           │
│                               ▼                                           │
│                 [Background: Validate & Store]                            │
│                               │                                           │
│                               ▼                                           │
│                chrome.storage.sync.set()                                  │
│                               │                                           │
│                               ▼                                           │
│                    [Popup: Show Success] ✓                                │
│                                                                           │
│  2. NEXT DAY: REMINDER                                                    │
│  ─────────────────────                                                    │
│                                                                           │
│  [Alarm Fires] ──────► [Background: Check Pending]                        │
│                               │                                           │
│                      (pending sites > 0?)                                 │
│                               │ yes                                       │
│                               ▼                                           │
│                chrome.notifications.create()                              │
│                               │                                           │
│                               ▼                                           │
│                    [User Sees Notification]                               │
│                               │                                           │
│                          click notification                               │
│                               │                                           │
│                               ▼                                           │
│                       [Popup Opens]                                       │
│                                                                           │
│  3. USER VISITS & CHECKS IN                                               │
│  ──────────────────────────                                               │
│                                                                           │
│  [User clicks site in list]                                               │
│                               │                                           │
│                               ▼                                           │
│               chrome.tabs.create({ url })                                 │
│                               │                                           │
│                               ▼                                           │
│               [Content Script Loads on Site]                              │
│                               │                                           │
│              (site URL matches saved site?)                               │
│                               │ yes                                       │
│                               ▼                                           │
│              chrome.runtime.sendMessage(SITE_VISITED)                     │
│                               │                                           │
│                               ▼                                           │
│                [Background: Update Visit Status]                          │
│                               │                                           │
│                               ▼                                           │
│                chrome.storage.sync.set()                                  │
│                               │                                           │
│                               ▼                                           │
│               [Badge Updates: N-1 Pending] ✓                              │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Model

### 7.1 Site Entity

```typescript
interface Site {
  // Core identification
  id: string;                    // UUID v4
  url: string;                   // Full URL
  hostname: string;              // Extracted hostname for matching
  title: string;                 // Page title
  favicon: string;               // Favicon URL or data URI
  
  // User metadata
  notes?: string;                // Optional user notes
  tags?: string[];               // Optional categorization
  
  // Check-in tracking
  lastVisited?: number;          // Timestamp of last visit
  lastCheckedIn?: number;        // Timestamp of last manual check-in
  checkInHistory: CheckInRecord[];  // Historical records
  
  // Settings
  frequency: CheckInFrequency;   // How often to check in
  autoDetect: boolean;           // Auto-mark on visit
  reminderEnabled: boolean;      // Include in reminders
  
  // Metadata
  createdAt: number;             // Timestamp created
  updatedAt: number;             // Timestamp last modified
}

interface CheckInRecord {
  timestamp: number;
  type: 'visit' | 'manual';      // How it was recorded
}

type CheckInFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
```

### 7.2 Reminder Settings

```typescript
interface ReminderSettings {
  enabled: boolean;
  times: ReminderTime[];         // Multiple reminder times
  sound: boolean;                // Play notification sound
  snoozeMinutes: number;         // Default snooze duration
}

interface ReminderTime {
  id: string;
  hour: number;                  // 0-23
  minute: number;                // 0-59
  days: DayOfWeek[];             // Which days to trigger
  enabled: boolean;
}

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;  // Sun-Sat
```

### 7.3 App Settings

```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  showBadge: boolean;            // Show pending count on icon
  resetTime: number;             // Hour to reset daily check-ins (0-23)
  defaultFrequency: CheckInFrequency;
  autoDetectVisits: boolean;     // Global auto-detect setting
}
```

### 7.4 Storage Schema

```typescript
interface StorageSchema {
  // Sync storage (synced across devices)
  sites: Site[];
  settings: AppSettings;
  reminders: ReminderSettings;
  
  // Local storage (device-specific)
  cache: {
    lastSync: number;
    badgeCount: number;
  };
}
```

### 7.5 Sample Data

```json
{
  "sites": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/daily-rewards",
      "hostname": "example.com",
      "title": "Daily Rewards - Example Site",
      "favicon": "https://example.com/favicon.ico",
      "notes": "Collect daily coins",
      "tags": ["rewards", "daily"],
      "lastVisited": 1702300800000,
      "lastCheckedIn": 1702300800000,
      "checkInHistory": [
        { "timestamp": 1702300800000, "type": "visit" },
        { "timestamp": 1702214400000, "type": "manual" }
      ],
      "frequency": "daily",
      "autoDetect": true,
      "reminderEnabled": true,
      "createdAt": 1702000000000,
      "updatedAt": 1702300800000
    }
  ],
  "settings": {
    "theme": "system",
    "language": "zh-CN",
    "showBadge": true,
    "resetTime": 0,
    "defaultFrequency": "daily",
    "autoDetectVisits": true
  },
  "reminders": {
    "enabled": true,
    "times": [
      {
        "id": "morning",
        "hour": 9,
        "minute": 0,
        "days": [1, 2, 3, 4, 5],
        "enabled": true
      }
    ],
    "sound": true,
    "snoozeMinutes": 30
  }
}
```

---

## 8. Theming Guidelines

### 8.1 Theme Modes

The extension supports three theme modes:
- **Light Mode**: Clean white backgrounds, dark text
- **Dark Mode**: Dark backgrounds, light text
- **System Mode**: Follows OS/browser preference

### 8.2 Color Tokens

```css
/* Light Mode */
:root {
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;
  --bg-hover: #E5E7EB;
  
  /* Text */
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-tertiary: #9CA3AF;
  --text-inverse: #FFFFFF;
  
  /* Borders */
  --border-light: #E5E7EB;
  --border-medium: #D1D5DB;
  
  /* Accents */
  --accent-primary: #4F46E5;
  --accent-primary-hover: #4338CA;
  --accent-success: #10B981;
  --accent-warning: #F59E0B;
  --accent-error: #EF4444;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark Mode */
:root.dark {
  /* Backgrounds */
  --bg-primary: #1F2937;
  --bg-secondary: #111827;
  --bg-tertiary: #374151;
  --bg-hover: #4B5563;
  
  /* Text */
  --text-primary: #F9FAFB;
  --text-secondary: #D1D5DB;
  --text-tertiary: #9CA3AF;
  --text-inverse: #111827;
  
  /* Borders */
  --border-light: #374151;
  --border-medium: #4B5563;
  
  /* Accents (slightly adjusted for dark mode visibility) */
  --accent-primary: #6366F1;
  --accent-primary-hover: #818CF8;
  --accent-success: #34D399;
  --accent-warning: #FBBF24;
  --accent-error: #F87171;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

### 8.3 Component Examples

#### Button Styles

```css
/* Primary Button */
.btn-primary {
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: background 150ms ease;
}
.btn-primary:hover {
  background: var(--accent-primary-hover);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  padding: 8px 16px;
  border-radius: 6px;
}
.btn-secondary:hover {
  background: var(--bg-hover);
}
```

#### Site List Item

```css
.site-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  transition: all 150ms ease;
}
.site-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-medium);
}
.site-item.completed {
  opacity: 0.7;
}
.site-item.completed .site-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}
```

### 8.4 Icon Guidelines

- Use consistent icon set (recommend: Lucide Icons)
- Icon sizes: 16px (inline), 20px (buttons), 24px (headers)
- Icons should use `currentColor` for theme compatibility
- Interactive icons should have hover states

### 8.5 Animation Guidelines

```css
/* Check completion animation */
@keyframes checkmark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.check-animation {
  animation: checkmark 300ms ease-out;
}

/* Item removal animation */
@keyframes slideOut {
  to {
    opacity: 0;
    transform: translateX(-10px);
  }
}

.removing {
  animation: slideOut 200ms ease-out forwards;
}
```

---

## 9. Task Breakdown

### Phase 1: Foundation (MVP) - Week 1-2

| Task | Description | Estimate | Dependencies |
|------|-------------|----------|--------------|
| T1.1 | Project scaffolding (Vite + React + TS) | 2h | None |
| T1.2 | Manifest V3 configuration | 1h | T1.1 |
| T1.3 | Basic popup UI shell | 3h | T1.1 |
| T1.4 | Chrome storage utility functions | 2h | T1.1 |
| T1.5 | Background service worker setup | 2h | T1.2 |
| T1.6 | Site data model implementation | 2h | T1.4 |
| T1.7 | Save current tab functionality | 4h | T1.3, T1.5, T1.6 |
| T1.8 | Site list display component | 4h | T1.3, T1.6 |
| T1.9 | Mark as done functionality | 2h | T1.8 |
| T1.10 | Delete site functionality | 2h | T1.8 |
| T1.11 | Open site in new tab | 1h | T1.8 |
| T1.12 | Basic light theme styling | 4h | T1.8 |

**Phase 1 Total: ~29 hours**

### Phase 2: Polish & Reminders - Week 3

| Task | Description | Estimate | Dependencies |
|------|-------------|----------|--------------|
| T2.1 | Options page shell | 2h | T1.1 |
| T2.2 | Reminder settings UI | 4h | T2.1 |
| T2.3 | Chrome alarms integration | 3h | T1.5 |
| T2.4 | Notification system | 3h | T2.3 |
| T2.5 | Dark theme implementation | 3h | T1.12 |
| T2.6 | System theme detection | 1h | T2.5 |
| T2.7 | Badge count updates | 2h | T1.5 |
| T2.8 | Empty states & loading states | 2h | T1.8 |
| T2.9 | Edit site functionality | 3h | T1.8 |
| T2.10 | Search/filter sites | 3h | T1.8 |

**Phase 2 Total: ~26 hours**

### Phase 3: Auto-Detection & History - Week 4

| Task | Description | Estimate | Dependencies |
|------|-------------|----------|--------------|
| T3.1 | Content script setup | 2h | T1.2 |
| T3.2 | Visit detection logic | 4h | T3.1 |
| T3.3 | Auto mark on visit | 2h | T3.2, T1.9 |
| T3.4 | Check-in history storage | 3h | T1.6 |
| T3.5 | History view in popup | 4h | T3.4 |
| T3.6 | Streak calculation & display | 3h | T3.4 |
| T3.7 | Data export functionality | 2h | T2.1 |
| T3.8 | Data import functionality | 2h | T3.7 |

**Phase 3 Total: ~22 hours**

### Phase 4: Enhancement - Week 5

| Task | Description | Estimate | Dependencies |
|------|-------------|----------|--------------|
| T4.1 | Tags/categories system | 4h | T1.6 |
| T4.2 | Filter by tags | 2h | T4.1 |
| T4.3 | Custom check-in frequency | 3h | T1.6 |
| T4.4 | Snooze reminder functionality | 2h | T2.4 |
| T4.5 | Keyboard shortcuts | 3h | T1.3 |
| T4.6 | Accessibility improvements | 4h | All |
| T4.7 | Performance optimization | 3h | All |
| T4.8 | Internationalization (i18n) | 4h | All |

**Phase 4 Total: ~25 hours**

### Task Dependency Graph

```
T1.1 (Scaffolding)
  ├─► T1.2 (Manifest) ──► T1.5 (Background)
  │                           │
  │                           ├──► T2.3 (Alarms) ──► T2.4 (Notifications)
  │                           │                           │
  │                           ├──► T2.7 (Badge)          │
  │                           │                           ▼
  │                           └──► T3.1 (Content) ──► T3.2 (Visit Detection)
  │                                                       │
  ├─► T1.3 (Popup Shell)                                  ▼
  │       │                                          T3.3 (Auto Mark)
  │       ├──► T1.7 (Save Tab)
  │       │
  │       └──► T1.8 (Site List)
  │               │
  │               ├──► T1.9 (Mark Done)
  │               ├──► T1.10 (Delete)
  │               ├──► T1.11 (Open)
  │               ├──► T2.8 (States)
  │               ├──► T2.9 (Edit)
  │               └──► T2.10 (Search)
  │
  └─► T1.4 (Storage Utils) ──► T1.6 (Data Model)
                                    │
                                    ├──► T3.4 (History Storage)
                                    │         │
                                    │         ├──► T3.5 (History View)
                                    │         └──► T3.6 (Streaks)
                                    │
                                    └──► T4.1 (Tags)
```

---

## 10. Future Considerations

### Potential Features (Post-MVP)

1. **Browser Sync**: Sync data across Chrome profiles
2. **Mobile Companion**: PWA for mobile check-in tracking
3. **Widgets**: Desktop widget showing pending check-ins
4. **Calendar View**: Visual calendar showing check-in history
5. **Analytics**: Charts showing check-in patterns
6. **Social Features**: Share streaks, leaderboards
7. **Automation**: Auto-click common check-in buttons
8. **Multi-browser**: Firefox/Edge extension versions

### Technical Debt Considerations

- Consider migration path if Chrome deprecates Manifest V3 features
- Plan for storage quota limits (sync storage is limited)
- Design for offline-first with sync reconciliation

### Security Considerations

- No sensitive data collection
- Content script should have minimal permissions
- Regular security audits of dependencies
- Clear data handling in privacy policy

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| 签到 (Qiāndào) | Check-in; the act of logging into or visiting a site to record presence |
| 访问 (Fǎngwèn) | Visit; browsing to a website |
| 提醒 (Tíxǐng) | Reminder; notification to prompt user action |
| MV3 | Manifest Version 3; Chrome's extension platform version |
| Service Worker | Background script that runs independently of web pages |

## Appendix B: Reference Links

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Alarms API](https://developer.chrome.com/docs/extensions/reference/alarms/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

---

*This specification is a living document and will be updated as the project evolves.*
