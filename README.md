# FreshSave

FreshSave is a revenue recovery platform for grocery stores that helps reduce food waste by intelligently discounting near-expiry products.

This is a **monorepo** containing both the staff-facing mobile app and the web dashboard.

## Structure

```
freshsave/
├── mobile/          # Expo (React Native) staff app
│   └── (see mobile/README.md)
├── app/             # Web dashboard (Next.js / Vite + React)
├── PRD.md           # Product requirements
└── ...
```

## Projects

### Mobile (Staff Tool)
- **Location**: `mobile/`
- **Tech**: Expo SDK 56 + Expo Router + TypeScript
- **Focus**: Floor staff — fast scanning (barcode + OCR), smart discounts, label printing, today's action list
- **Run**:
  ```bash
  cd mobile
  npx expo start
  ```

### Web (Dashboard)
- **Location**: Root (or `app/`)
- **Tech**: Vite + React 19 + Tailwind + shadcn/ui
- **Focus**: Manager dashboard — revenue analytics, multi-store, reports, email automation
- See `PRD.md` for full feature set

## Getting Started

### Mobile App (TestFlight / Internal)
See [mobile/TESTFLIGHT.md](mobile/TESTFLIGHT.md) for detailed instructions on building and distributing via TestFlight.

Quick commands:
```bash
cd mobile
npm run build:ios          # Production build for TestFlight
npm run build:internal     # Faster internal testing
```

### Web App
```bash
npm install
npm run dev
```

## Repository Structure

This repository uses a **git subtree** for the mobile app (located in `mobile/`).

### Alternative: Submodules
A `.gitmodules` file is included if you prefer the submodule approach instead of subtree.

To switch:
```bash
git rm -r mobile
git submodule add https://github.com/clarkpowers2/freshsave-mobile.git mobile
git add .gitmodules
```

## Related Repositories (if split)

- Main monorepo: `clarkpowers2/freshsave`
- Standalone mobile (recommended for independent mobile releases): `clarkpowers2/freshsave-mobile`

## Key Business Logic

Both apps share the same **Smart Discount Engine**:
- Base discount by days to expiry (50% / 30% / 15% / 5%)
- Category modifiers (Meat +20%, Fruit +15%, Dairy +10%)
- Time-of-day modifiers
- Max 75%

See `mobile/lib/productUtils.ts` and `src/lib/productUtils.ts` (web) for the implementation.

## License

MIT (Spark template components) + project-specific logic.
