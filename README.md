# 签到助手 (Check-in Assistant)

A lightweight Chrome extension to track websites you need to visit regularly for check-ins, daily rewards, or routine tasks.

## 📋 Project Status

**Status:** Planning Phase

This project is currently in the specification and planning phase. No implementation has started yet.

## 📖 Documentation

### Specification

The complete product specification is available at:

- **[docs/spec.md](./docs/spec.md)** - Full product specification including:
  - Product vision and design philosophy
  - User stories and prioritized scenarios
  - Visual style guidelines (inspired by Todoist & Notion Web Clipper)
  - High-level architecture (Manifest V3, React, TypeScript)
  - Interaction flows and Chrome API usage
  - Data model for sites and reminders
  - Theming guidelines (light/dark modes)
  - Task breakdown for implementation

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

## 🛠️ Tech Stack (Planned)

| Component | Technology |
|-----------|------------|
| Extension Platform | Chrome Manifest V3 |
| UI Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| State Management | Zustand |

## 📁 Project Structure (Planned)

```
├── src/
│   ├── background/       # Service worker
│   ├── popup/           # Popup React app
│   ├── options/         # Options page React app
│   ├── content/         # Content script
│   ├── shared/          # Shared utilities & types
│   └── assets/          # Icons and images
├── public/
│   └── manifest.json    # Extension manifest
├── docs/
│   └── spec.md          # Product specification
└── README.md
```

## 🚀 Getting Started

Implementation has not yet begun. Check the [specification](./docs/spec.md) for the planned implementation approach.

## 📄 License

TBD

---

*签到助手 - Never miss a daily check-in again!*
