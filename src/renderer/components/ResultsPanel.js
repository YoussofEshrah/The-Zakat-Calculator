export class ResultsPanel {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'results';
    this.showEmpty();
    container.appendChild(this.el);
  }

  showEmpty() {
    this.el.innerHTML = `
      <div class="results__empty">
        <div class="results__empty-icon">&#9646;</div>
        <div class="results__empty-text">
          Add your assets and click<br><strong>Calculate Zakat</strong> to see results
        </div>
      </div>
    `;
  }

  showMessage(type, text) {
    const icon = type === 'error' ? '&#9888;' : '&#8505;';
    this.el.innerHTML = `
      <div class="results__empty">
        <div class="results__empty-icon">${icon}</div>
        <div class="results__empty-text results__empty-text--${type}">${text}</div>
      </div>
    `;
  }

  showResults(result) {
    const { outputCurrency, totalWealth, totalZakat, categories } = result;
    const fmt = (v) => this._formatCurrency(v, outputCurrency);
    const noZakat = totalZakat === 0;

    const totalBannerClass = noZakat ? 'results__total results__total--none' : 'results__total';
    const totalLabel = noZakat ? 'No Zakat Required' : 'Total Zakat Due';
    const totalAmount = noZakat
      ? '<div class="results__total-none-msg">None of your assets have reached their Nisab threshold.</div>'
      : `<div class="results__total-amount">${fmt(totalZakat)}</div>`;

    const catSections = [
      this._renderMetalCategory('Gold', 'gold', categories.gold, outputCurrency),
      this._renderMetalCategory('Silver', 'silver', categories.silver, outputCurrency),
      this._renderCashCategory(categories.cash, outputCurrency),
    ].join('');

    this.el.innerHTML = `
      <div class="results__content">
        <div class="${totalBannerClass}">
          <div class="results__total-label">${totalLabel}</div>
          ${totalAmount}
          <div class="results__total-wealth">Total wealth: ${fmt(totalWealth)}</div>
        </div>
        <div class="results__categories">
          ${catSections || '<div class="results__no-categories">No assets entered with a value.</div>'}
        </div>
      </div>
    `;
  }

  _renderMetalCategory(name, cssClass, cat, currency) {
    if (cat.totalValue === 0) return '';
    const fmt = (v) => this._formatCurrency(v, currency);
    const nisabPct = cat.nisabGrams > 0
      ? Math.min(100, (cat.totalPureGrams / cat.nisabGrams) * 100).toFixed(0)
      : 100;

    return `
      <div class="results__category results__category--${cssClass}">
        <div class="results__category-header">
          <span class="results__category-name">${name}</span>
          ${this._nisabBadge(cat.nisabMet)}
        </div>
        <div class="results__category-detail">
          <span>Pure weight</span>
          <span>${this._formatNumber(cat.totalPureGrams)} g</span>
        </div>
        <div class="results__category-detail">
          <span>Nisab threshold</span>
          <span>${cat.nisabGrams} g</span>
        </div>
        <div class="results__progress">
          <div class="results__progress-bar" style="width: ${nisabPct}%"></div>
        </div>
        <div class="results__category-detail">
          <span>Value</span>
          <span>${fmt(cat.totalValue)}</span>
        </div>
        <div class="results__category-zakat ${cat.nisabMet ? '' : 'results__category-zakat--zero'}">
          Zakat: ${fmt(cat.zakatDue)}
        </div>
      </div>
    `;
  }

  _renderCashCategory(cat, currency) {
    if (cat.totalValue === 0) return '';
    const fmt = (v) => this._formatCurrency(v, currency);
    const nisabPct = cat.nisabValueOutput > 0
      ? Math.min(100, (cat.totalValue / cat.nisabValueOutput) * 100).toFixed(0)
      : 100;

    return `
      <div class="results__category results__category--cash">
        <div class="results__category-header">
          <span class="results__category-name">Cash &amp; Savings</span>
          ${this._nisabBadge(cat.nisabMet)}
        </div>
        <div class="results__category-detail">
          <span>Total cash value</span>
          <span>${fmt(cat.totalValue)}</span>
        </div>
        <div class="results__category-detail">
          <span>Nisab (85g gold)</span>
          <span>${fmt(cat.nisabValueOutput)}</span>
        </div>
        <div class="results__progress">
          <div class="results__progress-bar" style="width: ${nisabPct}%"></div>
        </div>
        <div class="results__category-zakat ${cat.nisabMet ? '' : 'results__category-zakat--zero'}">
          Zakat: ${fmt(cat.zakatDue)}
        </div>
      </div>
    `;
  }

  _nisabBadge(met) {
    return met
      ? `<span class="results__category-badge results__category-badge--met">&#10003; Nisab Met</span>`
      : `<span class="results__category-badge results__category-badge--not-met">Below Nisab</span>`;
  }

  _formatCurrency(amount, currencyCode) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  }

  _formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
}
