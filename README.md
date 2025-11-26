# Twitter Schedule Shortcuts

A Chrome extension that adds quick "hours from now" buttons to the X.com (Twitter) scheduling modal.

## Features

- Injects a UI strip inside the Twitter schedule modal with buttons like `1H, 2H, ..., 12H`
- Clicking a button sets the native Twitter schedule fields to "now + N hours"
- Shows time equivalents in your local timezone, US Eastern, and UK London
- Supports both light and dark Twitter themes
- No backend, no posting automation - just DOM + UX sugar

## Installation

### Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Build the extension:
   ```bash
   bun run build
   ```

3. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development with watch mode

```bash
bun run dev
```

This will watch for changes and rebuild automatically.

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

## Tech Stack

- **TypeScript** - Type safety
- **React** - UI components
- **Tailwind CSS** - Styling (with `tss-` prefix to avoid conflicts)
- **shadcn/ui** - UI primitives
- **Biome** - Linting and formatting
- **Vite** - Build tool
- **Bun** - Package manager and runtime

## Scripts

- `bun run build` - Build for production
- `bun run dev` - Build with watch mode
- `bun run check` - Run Biome checks
- `bun run check:fix` - Fix Biome issues
- `bun run format` - Format code
- `bun run lint` - Lint code

## How It Works

1. The content script uses a `MutationObserver` to detect when Twitter's schedule modal opens
2. When detected, it injects a React root element inside the modal
3. The UI provides hour buttons (1-12H) that calculate "now + N hours"
4. Clicking a button updates Twitter's native `<select>` elements with the calculated date/time
5. Time is displayed in local timezone, US Eastern, and UK London for reference

## License

MIT
