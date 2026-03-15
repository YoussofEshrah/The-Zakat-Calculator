import { AssetForm } from '../components/AssetForm.js';
import { ResultsPanel } from '../components/ResultsPanel.js';
import { CurrencyPicker } from '../components/CurrencyPicker.js';
import { StatusBar } from '../components/StatusBar.js';

export class CalculatorView {
  constructor(appEl) {
    this.appEl = appEl;
    this.prices = null;
    this.lastResult = null;
    this._build();
    this._fetchPrices();
  }

  _build() {
    // Header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div class="app-header__brand">
        <span class="app-header__title">Zakat Calculator</span>
        <span class="app-header__subtitle">Wealth Purification</span>
      </div>
      <div class="app-header__right" id="header-right"></div>
    `;
    this.appEl.appendChild(header);

    this.currencyPicker = new CurrencyPicker(header.querySelector('#header-right'), 'USD');
    this.currencyPicker.onChange(() => this._recalculate());

    // Main
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
    const resultsPanelEl = document.createElement('div');
    resultsPanelEl.className = 'panel panel--results';
    this.resultsPanel = new ResultsPanel(resultsPanelEl);

    main.appendChild(inputPanel);
    main.appendChild(resultsPanelEl);
    this.appEl.appendChild(main);

    // Status bar
    this.statusBar = new StatusBar(this.appEl);
  }

  async _fetchPrices() {
    this.statusBar.setStatus('loading', 'Fetching latest prices\u2026');
    try {
      const result = await window.zakatAPI.fetchPrices();
      this.prices = result;

      const ts = new Date().toLocaleTimeString();
      const via = result.metalProvider ? ` · ${result.metalProvider}` : '';
      if (result.stale) {
        this.statusBar.setStatus('stale', `Using cached prices${via} — could not reach server (${ts})`);
      } else if (result.fromCache) {
        this.statusBar.setStatus('live', `Prices from cache${via} (${ts})`);
      } else {
        this.statusBar.setStatus('live', `Live prices loaded${via} (${ts})`);
      }

      // Re-run calculation if we already had one displayed
      if (this.lastResult) this._recalculate();
    } catch (err) {
      this.prices = null;
      this.statusBar.setStatus('error', `Could not load prices: ${err.message}`, () => this._fetchPrices());
    }
  }

  async _onCalculate() {
    // Validate: need prices
    if (!this.prices) {
      await this._fetchPrices();
      if (!this.prices) return;
    }

    // Validate: need at least one asset
    const assets = this.assetForm.getAllValues();
    if (assets.length === 0) {
      this.resultsPanel.showMessage('info', 'No assets entered. Add at least one asset to calculate Zakat.');
      return;
    }

    this._setCalcLoading(true);
    try {
      const result = await window.zakatAPI.calculateZakat({
        assets,
        metalPrices: this.prices.metalPrices,
        exchangeRates: this.prices.exchangeRates,
        outputCurrency: this.currencyPicker.getValue(),
      });
      this.lastResult = { assets, result };
      this.resultsPanel.showResults(result);
    } catch (err) {
      this.resultsPanel.showMessage('error', `Calculation failed: ${err.message}`);
    } finally {
      this._setCalcLoading(false);
    }
  }

  async _recalculate() {
    if (!this.lastResult || !this.prices) return;
    try {
      const result = await window.zakatAPI.calculateZakat({
        assets: this.lastResult.assets,
        metalPrices: this.prices.metalPrices,
        exchangeRates: this.prices.exchangeRates,
        outputCurrency: this.currencyPicker.getValue(),
      });
      this.lastResult.result = result;
      this.resultsPanel.showResults(result);
    } catch {
      // Silently ignore currency switch errors
    }
  }

  _setCalcLoading(loading) {
    if (loading) {
      this.calcBtn.disabled = true;
      this.calcBtn.innerHTML = '<span class="spinner"></span> Calculating\u2026';
    } else {
      this.calcBtn.disabled = false;
      this.calcBtn.textContent = 'Calculate Zakat';
    }
  }
}
