# 签到助手 (Check-in Assistant)

A lightweight Chrome extension to track websites you need to visit regularly for check-ins, daily rewards, or routine tasks.

## 📋 Project Status

**Status:** Development Phase

The project scaffold is complete with a fully functional Chrome Extension Manifest V3 setup using Vite, React, and TypeScript.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd checkin-assistant

# Install dependencies
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

This will:
1. Start Vite dev server with HMR (Hot Module Replacement)
2. Build the extension to the `dist` folder
3. Watch for file changes and rebuild automatically

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension icon should appear in your toolbar

> **Note:** During development, the extension will auto-reload when you make changes. If it doesn't, click the refresh icon on the extension card in `chrome://extensions/`.

### Building for Production

Create a production build:

```bash
npm run build
```

The optimized extension will be output to the `dist` folder.

## 📁 Project Structure

```
├── src/
│   ├── background/       # Service worker (background.ts)
│   ├── popup/            # Popup React app
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── options/          # Options page React app
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── content/          # Content script (vanilla TS)
│   ├── shared/           # Shared utilities & types
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── styles/           # Global styles (Tailwind CSS)
│   ├── __tests__/        # Test files
│   └── manifest.ts       # Extension manifest definition
├── public/
│   └── icons/            # Extension icons
├── docs/
│   └── spec.md           # Product specification
├── dist/                 # Build output (git-ignored)
└── README.md
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and fix auto-fixable issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Extension Platform | Chrome Manifest V3 |
| UI Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite + @crxjs/vite-plugin |
| State Management | Zustand |
| Testing | Vitest |
| Linting | ESLint |
| Formatting | Prettier |

## 📝 Extension Features

### Current (Scaffold)

- ✅ Popup UI with React
- ✅ Options page with React
- ✅ Background service worker
- ✅ Content script
- ✅ Chrome storage integration
- ✅ Notification support
- ✅ Alarm API integration

### Permissions

The extension requests the following permissions:

- `storage` - Save check-in sites and settings
- `tabs` - Get current tab info for quick-add
- `activeTab` - Access active tab URL and title
- `alarms` - Schedule reminder notifications
- `notifications` - Display check-in reminders

## 📖 Documentation

- **[docs/spec.md](./docs/spec.md)** - Full product specification including:
  - Product vision and design philosophy
  - User stories and prioritized scenarios
  - Visual style guidelines
  - High-level architecture
  - Data model definitions
  - Task breakdown

## ✨ Planned Features

### MVP (Phase 1)
- [ ] Save current tab as check-in site
- [ ] View list of saved sites
- [ ] Mark sites as visited/checked-in
- [ ] Delete sites from list
- [ ] Light theme UI

### Phase 2
- [ ] Reminder notifications
- [ ] Dark theme
- [ ] Search and filter sites
- [ ] Edit site details

### Phase 3
- [ ] Auto-detect visits via content script
- [ ] Check-in history and streaks
- [ ] Data export/import

### Phase 4
- [ ] Tags and categories
- [ ] Custom check-in frequencies
- [ ] Keyboard shortcuts
- [ ] Internationalization (i18n)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📄 License

TBD

---

*签到助手 - Never miss a daily check-in again!*
