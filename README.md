<div align="center">

# ⚡ Twitter/X Schedule Shortcuts

![Demo](https://media4.giphy.com/media/1CrHkXdEOagOU5vsSb/giphy.gif)

**A Chrome extension that adds quick "hours from now" buttons to the X.com (Twitter) scheduling modal.**

---

</div>

## ✨ Features

- ⏱️ **Quick hour buttons** - One-click scheduling with `1H, 2H, ..., 12H` buttons
- 🎯 **Smart time setting** - Automatically calculates and sets "now + N hours"
- 🌍 **Multi-timezone preview** - See times in your local timezone, US Eastern, and UK London
- 🎨 **Theme support** - Works seamlessly with both light and dark Twitter themes
- 🔒 **Privacy-first** - No backend, no data collection, just local DOM manipulation

## 📦 Installation

### 👥 For Users

1. **Download** or clone this repository
2. **Install dependencies:**
   ```bash
   bun install
   ```
3. **Build the extension:**
   ```bash
   bun run build
   ```
4. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `dist` folder from this project
   - Done! 🎉

> The extension automatically activates when you open the scheduling modal on x.com

### 🛠️ For Developers

**Development with watch mode:**

```bash
bun run dev
```

This watches for changes and rebuilds automatically. Refresh the extension in `chrome://extensions/` to see updates.

## Project Structure

```
├── manifest.json          # Chrome extension manifest (v3)
├── src/
│   ├── content/           # Content script (injected into x.com)
│   │   ├── index.tsx      # Entry point, MutationObserver setup
│   │   ├── twitterSelectors.ts  # DOM selectors for Twitter
│   │   ├── timeUtils.ts   # Time/timezone utilities
│   │   └── ui/            # React components
│   │       ├── QuickScheduleRoot.tsx
│   │       ├── HourButtons.tsx
│   │       ├── TimezonePreview.tsx
│   │       └── InfoPopup.tsx
│   ├── background/        # Service worker
│   │   └── index.ts
│   ├── components/ui/     # shadcn/ui components
│   ├── lib/               # Utilities
│   └── styles/            # Tailwind CSS
└── dist/                  # Build output (load this in Chrome)
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| ⚡ **TypeScript** | Type safety |
| ⚛️ **React** | UI components |
| 🎨 **Tailwind CSS** | Styling (with `tss-` prefix) |
| 🎭 **shadcn/ui** | UI primitives |
| ✨ **Biome** | Linting & formatting |
| 🏗️ **Vite** | Build tool |
| 🍞 **Bun** | Package manager |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `bun run build` | 🏗️ Build for production |
| `bun run dev` | 👀 Build with watch mode |
| `bun run check` | ✅ Run Biome checks |
| `bun run check:fix` | 🔧 Fix Biome issues |
| `bun run format` | 💅 Format code |
| `bun run lint` | 🔍 Lint code |

## 🔧 How It Works

1. 👁️ Content script uses `MutationObserver` to detect when Twitter's schedule modal opens
2. 💉 Injects a React root element inside the modal
3. ⏰ Hour buttons calculate "now + N hours" in real-time
4. 🎯 Updates Twitter's native `<select>` elements with the calculated date/time
5. 🌐 Displays times across multiple timezones for convenience

---

## 🔒 Privacy & Compliance

### Privacy Policy

This extension collects minimal data to provide its functionality. We only store a single UI preference (whether you've dismissed the info popup) locally on your device using Chrome's storage API. No data is transmitted to any server, and we do not collect any personal information, browsing history, or usage analytics.

**Full Privacy Policy:** [PRIVACY.md](./PRIVACY.md)

### Chrome Web Store User Data Policy Compliance

This extension complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. User data collected by this extension is used solely for the extension's core functionality of providing quick scheduling shortcuts on X.com (Twitter). Specifically:

- ✅ Data is collected and used only for the extension's single purpose
- ✅ Data is NOT sold to third parties
- ✅ Data is NOT used or transferred for purposes unrelated to the extension's functionality
- ✅ Data is NOT used or transferred to determine creditworthiness or for lending purposes

### Data We Collect

- **UI Preference:** A single boolean flag (`tss_info_dismissed`) stored locally to remember if you dismissed the information popup

### Data We Do NOT Collect

- No personal identifiable information (PII)
- No browsing history or web activity
- No analytics or tracking
- No financial or authentication data
- No location data

All data remains on your device and is never transmitted externally.

---

## 📄 License

MIT

## 👋 Connect

Built by [@sup_nim](https://x.com/sup_nim) - say hi on Twitter!
