import { AssetForm } from '../components/AssetForm.js';
import { ResultsPanel } from '../components/ResultsPanel.js';
import { CurrencyPicker } from '../components/CurrencyPicker.js';
import { StatusBar } from '../components/StatusBar.js';

export class CalculatorView {
  constructor(appEl) {
    this.appEl = appEl;
    this.prices = null;
    this._build();
    this._fetchPrices();
  }

  _build() {
    // Header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div>
        <span class="app-header__title">Zakat Calculator</span>
        <span class="app-header__subtitle">Wealth Purification</span>
      </div>
      <div class="app-header__right" id="header-right"></div>
    `;
    this.appEl.appendChild(header);

    // Currency picker in header
    this.currencyPicker = new CurrencyPicker(
      header.querySelector('#header-right'),
      'USD'
    );
    this.currencyPicker.onChange(() => this._recalculate());

    // Main area
    const main = document.createElement('main');
    main.className = 'app-main';

    // Input panel
    const inputPanel = document.createElement('div');
    inputPanel.className = 'panel panel--input';

    const inputTitle = document.createElement('h2');
    inputTitle.className = 'section-title';
    inputTitle.textContent = 'Your Assets';
    inputPanel.appendChild(inputTitle);

    this.assetForm = new AssetForm(inputPanel);

    // Calculate button
    const calcSection = document.createElement('div');
    calcSection.className = 'calculate-section';

    this.calcBtn = document.createElement('button');
    this.calcBtn.className = 'btn btn--primary btn--lg';
    this.calcBtn.textContent = 'Calculate Zakat';
    this.calcBtn.addEventListener('click', () => this._onCalculate());
    calcSection.appendChild(this.calcBtn);
    inputPanel.appendChild(calcSection);

    // Results panel
    const resultsPanel = document.createElement('div');
    resultsPanel.className = 'panel panel--results';

    this.resultsPanel = new ResultsPanel(resultsPanel);

    main.appendChild(inputPanel);
    main.appendChild(resultsPanel);
    this.appEl.appendChild(main);

    // Status bar
    this.statusBar = new StatusBar(this.appEl);
  }

  async _fetchPrices() {
    this.statusBar.setStatus('', 'Fetching latest prices...');
    try {
      const result = await window.zakatAPI.fetchPrices();
      this.prices = result;

      if (result.stale) {
        this.statusBar.setStatus('stale', 'Using cached prices (could not reach server)');
      } else if (result.fromCache) {
        this.statusBar.setStatus('live', 'Prices loaded from cache');
      } else {
        this.statusBar.setStatus('live', 'Live prices loaded');
      }
    } catch (err) {
      this.prices = null;
      this.statusBar.setStatus('error', `Failed to load prices: ${err.message}`);
    }
  }

  async _onCalculate() {
    if (!this.prices) {
      await this._fetchPrices();
      if (!this.prices) {
        this.statusBar.setStatus('error', 'Cannot calculate without price data. Check your internet connection.');
        return;
      }
    }

    const assets = this.assetForm.getAllValues();
    if (assets.length === 0) {
      this.resultsPanel.showEmpty();
      return;
    }

    // ZakatEngine runs in main process via require — but we duplicate the pure
    // logic here in the renderer for responsiveness. Since the engine is pure
    // computation with no Node-specific deps beyond require, we inline it.
    const result = this._calculate(assets);
    this.resultsPanel.showResults(result);
  }

  _recalculate() {
    const assets = this.assetForm.getAllValues();
    if (assets.length === 0 || !this.prices) return;
    const result = this._calculate(assets);
    this.resultsPanel.showResults(result);
  }

  _calculate(assets) {
    const { metalPrices, exchangeRates } = this.prices;
    const outputCurrency = this.currencyPicker.getValue();
    const outputRate = exchangeRates[outputCurrency] || 1;

    const ZAKAT_RATE = 0.025;
    const NISAB_GOLD_GRAMS = 85;
    const NISAB_SILVER_GRAMS = 595;
    const TROY_OZ = 31.1035;

    const GOLD_PURITIES = { '24k': 1, '22k': 22/24, '21k': 21/24, '18k': 18/24 };
    const SILVER_PURITIES = { '999': 0.999, '925': 0.925, '900': 0.900, '800': 0.800 };

    const categories = { gold: [], silver: [], cash: [] };

    for (const asset of assets) {
      let valueUSD = 0;
      let pureGrams = 0;
      let label = '';

      if (asset.type === 'gold') {
        const wg = asset.fields.weightUnit === 'oz' ? asset.fields.weight * TROY_OZ : asset.fields.weight;
        const pf = GOLD_PURITIES[asset.fields.purity] || 1;
        pureGrams = wg * pf;
        valueUSD = pureGrams * metalPrices.goldPerGramUSD;
        label = `${asset.fields.weight} ${asset.fields.weightUnit === 'oz' ? 'oz' : 'g'} ${asset.fields.purity} gold`;
      } else if (asset.type === 'silver') {
        const wg = asset.fields.weightUnit === 'oz' ? asset.fields.weight * TROY_OZ : asset.fields.weight;
        const pf = SILVER_PURITIES[asset.fields.purity] || 1;
        pureGrams = wg * pf;
        valueUSD = pureGrams * metalPrices.silverPerGramUSD;
        label = `${asset.fields.weight} ${asset.fields.weightUnit === 'oz' ? 'oz' : 'g'} ${asset.fields.purity} silver`;
      } else if (asset.type === 'cash') {
        const rate = exchangeRates[asset.fields.currency] || 1;
        valueUSD = asset.fields.amount / rate;
        label = `${asset.fields.amount} ${asset.fields.currency}`;
      }

      categories[asset.type].push({ label, valueUSD, pureGrams, valueOutput: valueUSD * outputRate });
    }

    // Gold Nisab
    const goldPureGrams = categories.gold.reduce((s, e) => s + e.pureGrams, 0);
    const goldValueUSD = categories.gold.reduce((s, e) => s + e.valueUSD, 0);
    const goldNisabMet = goldPureGrams >= NISAB_GOLD_GRAMS;
    const goldZakat = goldNisabMet ? goldValueUSD * ZAKAT_RATE * outputRate : 0;

    // Silver Nisab
    const silverPureGrams = categories.silver.reduce((s, e) => s + e.pureGrams, 0);
    const silverValueUSD = categories.silver.reduce((s, e) => s + e.valueUSD, 0);
    const silverNisabMet = silverPureGrams >= NISAB_SILVER_GRAMS;
    const silverZakat = silverNisabMet ? silverValueUSD * ZAKAT_RATE * outputRate : 0;

    // Cash Nisab (vs 85g gold value)
    const cashNisabUSD = NISAB_GOLD_GRAMS * metalPrices.goldPerGramUSD;
    const cashTotalUSD = categories.cash.reduce((s, e) => s + e.valueUSD, 0);
    const cashNisabMet = cashTotalUSD >= cashNisabUSD;
    const cashZakat = cashNisabMet ? cashTotalUSD * ZAKAT_RATE * outputRate : 0;

    const totalZakat = goldZakat + silverZakat + cashZakat;
    const totalWealth = (goldValueUSD + silverValueUSD + cashTotalUSD) * outputRate;

    return {
      outputCurrency,
      totalWealth,
      totalZakat,
      categories: {
        gold: {
          totalPureGrams: goldPureGrams,
          nisabGrams: NISAB_GOLD_GRAMS,
          nisabMet: goldNisabMet,
          totalValue: goldValueUSD * outputRate,
          zakatDue: goldZakat,
          items: categories.gold,
        },
        silver: {
          totalPureGrams: silverPureGrams,
          nisabGrams: NISAB_SILVER_GRAMS,
          nisabMet: silverNisabMet,
          totalValue: silverValueUSD * outputRate,
          zakatDue: silverZakat,
          items: categories.silver,
        },
        cash: {
          nisabValueOutput: cashNisabUSD * outputRate,
          nisabMet: cashNisabMet,
          totalValue: cashTotalUSD * outputRate,
          zakatDue: cashZakat,
          items: categories.cash,
        },
      },
    };
  }
}
