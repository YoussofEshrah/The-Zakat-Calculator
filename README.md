# Zakat Calculator

A lightweight desktop app for calculating Zakat (Islamic wealth tax) based on your gold, silver, and cash holdings. Fetches live metal prices and exchange rates automatically and outputs your Zakat due in any currency of your choice.

---

## Features

- **Gold** — enter weight (grams or troy oz) and purity (24K / 22K / 21K / 18K)
- **Silver** — enter weight and purity (999 / 925 / 900 / 800)
- **Cash & Savings** — enter any amount in any supported currency (USD, EGP, EUR, GBP, SAR, AED, and more)
- **Per-category Nisab checks** — each asset type is evaluated independently against its own threshold
- **Live prices** — metal prices from [metals.live](https://metals.live) with automatic fallback providers; exchange rates from [open.er-api.com](https://open.er-api.com) (no API key needed)
- **Output in any currency** — switch the output currency from the header dropdown; results update instantly
- **Offline fallback** — prices are cached locally; the app still works if you're offline using the last known rates
- **Nisab progress bars** — see exactly how close each category is to its threshold

---

## Zakat Calculation Rules

Each asset category is checked **independently** against its own Nisab threshold:

| Category | Nisab Threshold | Zakat Rate |
|---|---|---|
| Gold | 85 g of pure (24K) gold | 2.5% of gold value |
| Silver | 595 g of pure (999) silver | 2.5% of silver value |
| Cash | Equivalent value of 85 g gold | 2.5% of total cash value |

Categories that do not reach their Nisab contribute **zero** to the total. There is no cross-category pooling.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [Git](https://git-scm.com)

### Install

```bash
git clone https://github.com/YoussofEshrah/The-Zakat-Calculator.git
cd "The-Zakat-Calculator"
npm install
```

### Run

```bash
npm start
```

> **Note:** If you are running from VS Code or any Electron-based terminal, the launch script automatically handles the `ELECTRON_RUN_AS_NODE` environment variable that would otherwise prevent the app from starting.

---

## Optional: Metal API Key

By default the app fetches metal prices from [metals.live](https://api.metals.live) — free, no signup. For a more reliable source, you can optionally add an API key from [metalpriceapi.com](https://metalpriceapi.com) (free tier: 100 requests/month).

Create a `.env` file in the project root:

```env
METAL_API_KEY=your_key_here
```

---

## Building a Standalone .exe

```bash
npm run dist
```

Outputs to `dist/Zakat Calculator-win32-x64/Zakat Calculator.exe` — a self-contained Windows app you can copy to any machine.

> To build an NSIS installer instead, run `npm run dist:builder` from an **elevated (admin) terminal** or after enabling **Windows Developer Mode** (Settings → System → For Developers).

---

## Project Structure

```
src/
├── main.js                    # Electron main process
├── preload.js                 # Context bridge (IPC to renderer)
├── core/
│   ├── ZakatEngine.js         # Calculation logic — single source of truth
│   ├── AssetTypes.js          # Extensible asset type registry
│   └── constants.js           # Nisab weights, purity tables, Zakat rate
├── services/
│   ├── ApiManager.js          # Orchestrates API calls + caching
│   ├── MetalPriceProvider.js  # 3-tier metal price fallback
│   ├── CurrencyProvider.js    # Exchange rate fetching
│   └── CacheService.js        # In-memory + file-backed cache
├── utils/
│   ├── conversions.js         # Weight unit conversions (g ↔ oz)
│   └── formatting.js          # Number/currency formatting
└── renderer/
    ├── index.html
    ├── app.js
    ├── styles/                # CSS with custom properties (theme-ready)
    ├── components/            # GoldEntry, SilverEntry, CashEntry, ResultsPanel, …
    └── views/
        └── CalculatorView.js  # Main page — wires components to IPC
```

---

## Adding New Asset Types

The registry pattern in `src/core/AssetTypes.js` makes it straightforward to add new asset types without touching existing code:

```js
registerAssetType('crypto', {
  label: 'Cryptocurrency',
  category: 'crypto',
  fields: [
    { name: 'coin',   type: 'select', options: [{ value: 'BTC', label: 'Bitcoin' }] },
    { name: 'amount', type: 'number', label: 'Amount', required: true },
  ],
  computeValueUSD(fields, prices) {
    return fields.amount * prices.cryptoPrices[fields.coin];
  },
});
```

The UI, engine, and results panel all pick it up automatically.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Desktop runtime | [Electron](https://www.electronjs.org) v32 |
| UI | Vanilla JS (ES2020) + CSS Custom Properties |
| Packaging | [@electron/packager](https://github.com/electron/packager) |
| Metal prices | [metals.live](https://metals.live) + [metalpriceapi.com](https://metalpriceapi.com) + [frankfurter.dev](https://frankfurter.dev) |
| Currency rates | [open.er-api.com](https://open.er-api.com) |

Zero runtime npm dependencies — only `electron` and `@electron/packager` as dev dependencies.

---

## License

ISC © Youssof Eshrah
