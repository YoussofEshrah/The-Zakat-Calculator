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
        <div class="results__empty-icon">&#9776;</div>
        <div class="results__empty-text">
          Add your assets and click<br><strong>Calculate Zakat</strong> to see results
        </div>
      </div>
    `;
  }

  showResults(result) {
    const { outputCurrency, totalWealth, totalZakat, categories } = result;
    const fmt = (v) => this._formatCurrency(v, outputCurrency);

    const catSections = [
      this._renderCategory('Gold', 'gold', categories.gold, outputCurrency),
      this._renderCategory('Silver', 'silver', categories.silver, outputCurrency),
      this._renderCashCategory(categories.cash, outputCurrency),
    ].join('');

    this.el.innerHTML = `
      <div class="results__content">
        <div class="results__total">
          <div class="results__total-label">Total Zakat Due</div>
          <div class="results__total-amount">${fmt(totalZakat)}</div>
          <div class="results__total-wealth">on total qualifying wealth of ${fmt(totalWealth)}</div>
        </div>
        ${catSections}
      </div>
    `;
  }

  _renderCategory(name, cssClass, cat, currency) {
    if (cat.totalValue === 0) return '';
    const fmt = (v) => this._formatCurrency(v, currency);

    const nisabInfo = cat.nisabMet
      ? `<span class="results__category-badge results__category-badge--met">Nisab Met</span>`
      : `<span class="results__category-badge results__category-badge--not-met">Below Nisab</span>`;

    const pureGramsLine = cat.totalPureGrams !== undefined
      ? `<div class="results__category-detail">
           <span>Pure weight</span>
           <span>${this._formatNumber(cat.totalPureGrams)} g (Nisab: ${cat.nisabGrams} g)</span>
         </div>`
      : '';

    return `
      <div class="results__category results__category--${cssClass}">
        <div class="results__category-header">
          <span class="results__category-name">${name}</span>
          ${nisabInfo}
        </div>
        <div class="results__category-detail">
          <span>Total value</span>
          <span>${fmt(cat.totalValue)}</span>
        </div>
        ${pureGramsLine}
        <div class="results__category-zakat">
          Zakat: ${fmt(cat.zakatDue)}
        </div>
      </div>
    `;
  }

  _renderCashCategory(cat, currency) {
    if (cat.totalValue === 0) return '';
    const fmt = (v) => this._formatCurrency(v, currency);

    const nisabInfo = cat.nisabMet
      ? `<span class="results__category-badge results__category-badge--met">Nisab Met</span>`
      : `<span class="results__category-badge results__category-badge--not-met">Below Nisab</span>`;

    return `
      <div class="results__category results__category--cash">
        <div class="results__category-header">
          <span class="results__category-name">Cash & Savings</span>
          ${nisabInfo}
        </div>
        <div class="results__category-detail">
          <span>Total value</span>
          <span>${fmt(cat.totalValue)}</span>
        </div>
        <div class="results__category-detail">
          <span>Cash Nisab (85g gold)</span>
          <span>${fmt(cat.nisabValueOutput)}</span>
        </div>
        <div class="results__category-zakat">
          Zakat: ${fmt(cat.zakatDue)}
        </div>
      </div>
    `;
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
