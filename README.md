# 签到助手 (Check-in Assistant)

> [中文文档](./README_CN.md)

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)](https://chrome.google.com)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)

A lightweight Chrome extension designed to help you track websites that require regular visits for check-ins, daily rewards, or routine tasks. Think of it as a focused bookmark manager specifically for sites requiring periodic visits.

## ✨ Key Features

- **Quick Save** – Add the current tab as a check-in site with one click, automatically extracting favicon and hostname
- **Status Tracking** – Mark sites as "Visited" or "Checked In" with clear visual indicators
- **Badge Counter** – Extension badge displays the number of pending check-ins at a glance
- **Scheduled Reminders** – Set daily reminder times using Chrome Alarms & Notifications
- **Snooze Support** – "Remind me later" option for flexible reminder handling
- **Auto-Detection** – Content script detects visits to saved sites and prompts to mark status
- **Theme Switching** – Choose Light, Dark, or System-based appearance
- **One-Click Reset** – Reset all daily statuses to start fresh

## 📸 Screenshots

<!-- TODO: Add screenshots of the extension in action -->
| Popup View | Options Page |
|------------|--------------|
| _Screenshot placeholder_ | _Screenshot placeholder_ |

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** (included with Node.js)

### Install Dependencies

```bash
npm install
```

### Build for Production

```bash
npm run build
```

The production build is output to the `dist/` directory.

## 📦 Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension icon should appear in your browser toolbar

> **Tip:** After making changes, click the refresh icon on the extension card in `chrome://extensions/` to reload the latest build.

## 📖 Usage Guide

### Popup Interface

The popup is the primary interface for managing your check-in sites:

1. **Add Current Site** – Click the extension icon while on any website, then click the "Add Current Page" button
2. **Manual Add** – Click the "+" button to manually enter a URL and optional title
3. **Mark Status** – Use the eye icon (👁) to mark as visited, or the checkmark (✓) to mark as checked in
4. **Open Site** – Click the site title to navigate directly to it
5. **Delete Site** – Click the trash icon to remove a site from your list
6. **Toggle Theme** – Click the sun/moon icon in the header to switch themes

### Options Page

Access the Options page by right-clicking the extension icon and selecting "Options", or click the gear icon in the popup:

- **Appearance** – Choose Light, Dark, or System theme; toggle badge visibility
- **Reminder Settings** – Enable/disable reminders, configure multiple reminder times with day-of-week selection
- **Notification Sound** – Toggle audio alerts for reminders
- **Snooze Duration** – Set how long "Remind me later" delays the next notification
- **Auto-Detection** – Enable automatic visit detection when browsing saved sites
- **Daily Reset Time** – Configure when daily statuses should reset
- **Data Management** – Clear all sites or reset today's status in bulk

## 🛠 Development Setup

### Environment Requirements

| Tool        | Version   |
|-------------|-----------|
| Node.js     | >= 18.0.0 |
| npm         | >= 8.0.0  |

### Available Scripts

| Command                  | Description                             |
|--------------------------|-----------------------------------------|
| `npm run dev`            | Start Vite dev server with HMR          |
| `npm run build`          | TypeScript compile + production build   |
| `npm run preview`        | Preview the production build locally    |
| `npm run lint`           | Run ESLint checks                       |
| `npm run lint:fix`       | Run ESLint and auto-fix issues          |
| `npm run format`         | Format code with Prettier               |
| `npm run format:check`   | Check code formatting without changes   |
| `npm run typecheck`      | Run TypeScript type checking            |
| `npm run test`           | Run Vitest unit tests                   |
| `npm run test:watch`     | Run tests in watch mode                 |

### Development Workflow

```bash
# Start the development server
npm run dev

# In Chrome, load the dist/ folder as an unpacked extension
# Changes will hot-reload automatically (popup/options pages)

# Run checks before committing
npm run lint && npm run typecheck && npm run test
```

## 📁 Project Structure

```plaintext
checkin-assistant/
├── public/
│   └── icons/              # Extension icons (16, 32, 48, 128 px)
├── src/
│   ├── background/
│   │   └── index.ts        # Service Worker (alarms, notifications, messaging)
│   ├── popup/
│   │   ├── index.html      # Popup entry HTML
│   │   ├── main.tsx        # React entry point
│   │   └── App.tsx         # Main popup component
│   ├── options/
│   │   ├── index.html      # Options page entry HTML
│   │   ├── main.tsx        # React entry point
│   │   ├── App.tsx         # Main options component
│   │   └── components/     # Reusable UI components
│   ├── content/
│   │   └── index.ts        # Content script for visit detection
│   ├── lib/
│   │   ├── storage.ts      # Chrome Storage API wrapper & data models
│   │   ├── hooks/          # Custom React hooks (useStorage)
│   │   └── index.ts        # Lib exports
│   ├── shared/
│   │   ├── types.ts        # Shared TypeScript types & interfaces
│   │   └── utils.ts        # Utility functions
│   ├── styles/
│   │   └── globals.css     # Tailwind CSS & global styles
│   ├── __tests__/          # Unit tests (Vitest)
│   ├── manifest.ts         # Extension manifest (MV3) definition
│   └── vite-env.d.ts       # Vite environment types
├── docs/
│   └── spec.md             # Product specification document
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc             # Prettier configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── vitest.config.ts        # Vitest test configuration
└── package.json            # Project dependencies & scripts
```

## 🧰 Tech Stack

| Category         | Technology                                                 |
|------------------|------------------------------------------------------------|
| Extension API    | Chrome Extension Manifest V3                               |
| UI Framework     | React 18 + TypeScript                                      |
| Build Tool       | Vite + [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) |
| Styling          | Tailwind CSS                                               |
| State Management | Zustand                                                    |
| Testing          | Vitest + jsdom                                             |
| Linting          | ESLint + Prettier                                          |
| Storage          | Chrome Storage Sync API                                    |

## 🌐 Localization

This project provides documentation in both English and Chinese:

- **English** – You are reading it
- **Chinese** – See [README_CN.md](./README_CN.md)

The extension UI is currently available in Chinese. Contributions for additional language support are welcome.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Before Submitting

1. **Fork** the repository and create a feature branch
2. **Install** dependencies: `npm install`
3. **Run checks** before committing:

   ```bash
   npm run lint        # Check for linting errors
   npm run typecheck   # Verify TypeScript types
   npm run test        # Run unit tests
   npm run format      # Format code
   ```

4. Ensure all checks pass with no errors

### Commit Messages

We recommend using [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add new feature`
- `fix: resolve bug in popup`
- `docs: update README`
- `style: format code`
- `refactor: restructure storage module`
- `test: add unit tests for utils`

### Pull Request Guidelines

- Provide a clear description of the changes and motivation
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass

## 📄 License

This project is open source. See the repository for license details.

---

Made with ❤️ for productivity enthusiasts
