# ⏱️ MultiTimer — The Ultimate Timer App

**MultiTimer** is a sleek, powerful, and fully local multi-timer application built for anyone who needs to track time across multiple tasks simultaneously. Whether you're a freelancer logging billable hours, a developer tracking focus sessions, or just someone who likes to stay on top of their time — MultiTimer has you covered.

> 🔒 **100% Local & Private** — No accounts, no servers, no tracking. All your data stays in your browser's localStorage. Your timers never leave your device.

## ✨ Features

### 🕐 Multiple Simultaneous Timers

Create as many timers as you need. Name them, start them, pause them, reset them — all independently. Each timer tracks time down to the millisecond with real-time updates powered by `requestAnimationFrame`.

### 🔀 Single & Multi Mode

- **Single mode** (default): Only one timer runs at a time. Starting a new timer automatically pauses the active one — perfect for task switching.
- **Multi mode**: Run multiple timers simultaneously for parallel task tracking.

### 🎯 Time Goals

Set a target duration for any timer. When the goal is reached, you'll receive a browser notification. Great for timeboxing tasks or enforcing work limits.

### 📅 Group by Date

Organize your timers by creation date. Timers are grouped under date headers with per-day totals, making it easy to review how you spent your time across different days.

### ✅ Checking Mode

Enable checking mode to mark timers as done with a checkbox. You can also check/uncheck all timers in a date group at once.

### 🖐️ Drag & Drop Reordering

Reorder timers freely with drag and drop (powered by `@dnd-kit`). When grouped by date, you can even drag timers between date groups to reassign their date.

### ✏️ Inline Editing

- **Timer name**: Click to rename any timer inline.
- **Hours / Minutes / Seconds**: Click on any time segment to manually adjust the elapsed time.

### 📋 Paste to Create

Paste text from your clipboard to instantly create a new timer with that text as its name. Supports Trello card URLs — the card title is automatically extracted.

### 🖼️ Picture-in-Picture Widget

Pop out a mini timer widget using the Document Picture-in-Picture API. Keep a floating timer visible on your screen while you work in other apps. The widget syncs dark mode, lets you cycle through timers, and supports inline time editing.

### ⏱️ Display Options

- **Milliseconds**: Toggle millisecond precision on the display.
- **Decimal time**: View elapsed time in decimal hours (e.g., `1.5` instead of `1:30:00`).

### 🌙 Dark Mode

Full dark mode support with automatic detection of your system preference. Toggle manually at any time.

### 📊 Total Time

A live total of all timer durations is displayed in the sticky header, always visible as you scroll.

### 💾 Import & Export

- **Export**: Download all your timers as a JSON file for backup or sharing.
- **Import**: Load timers from a previously exported JSON file.

### 📱 Progressive Web App (PWA)

Install MultiTimer on your device like a native app. It works offline, updates automatically, and supports standalone display with window controls overlay.

### 🔄 Persistent State

Everything is saved to `localStorage` in real-time. Close your browser, reopen it — your timers pick up right where they left off, even if they were running. A periodic save every 2 seconds plus saves on tab hide and before unload ensure no data is lost.

### 🎨 Smooth Animations

Polished transitions and animations throughout the UI powered by Framer Motion and Tailwind CSS Animate — from timer creation to deletion, drag overlays, settings dropdown, and goal modals.

## 🛠️ Tech Stack

| Technology                                           | Purpose                 |
| ---------------------------------------------------- | ----------------------- |
| [React 19](https://react.dev/)                       | UI framework            |
| [TypeScript](https://www.typescriptlang.org/)        | Type safety             |
| [Vite](https://vitejs.dev/)                          | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/)             | Utility-first styling   |
| [Framer Motion](https://www.framer.com/motion/)      | Animations              |
| [@dnd-kit](https://dndkit.com/)                      | Drag and drop           |
| [Lucide React](https://lucide.dev/)                  | Icons                   |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA support             |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/multichrono.git
cd multichrono
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## 📄 License

All rights reserved. Made with ❤️ by [Aurel](https://ablondel.com).
