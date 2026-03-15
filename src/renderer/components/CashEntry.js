const CURRENCIES = [
  'USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD',
  'JOD', 'OMR', 'TRY', 'MYR', 'IDR', 'PKR', 'INR', 'BDT',
];

export class CashEntry {
  constructor(onRemove) {
    this.onRemove = onRemove;
    this.el = document.createElement('div');
    this.el.className = 'asset-entry asset-entry--cash';

    const currencyOptions = CURRENCIES.map(c =>
      `<option value="${c}">${c}</option>`
    ).join('');

    this.el.innerHTML = `
      <div class="asset-entry__header">
        <span class="asset-entry__label">
          <span class="asset-entry__label-icon">&#36;</span>
          Cash & Savings
        </span>
        <button class="btn btn--danger btn--sm remove-btn" aria-label="Remove" title="Remove">&times;</button>
      </div>
      <div class="asset-entry__fields">
        <div class="field" style="flex: 2;">
          <label class="field__label">Amount</label>
          <input class="field__input" type="number" name="amount" placeholder="0.00" min="0" step="0.01">
        </div>
        <div class="field">
          <label class="field__label">Currency</label>
          <select class="field__select" name="currency">
            ${currencyOptions}
          </select>
        </div>
      </div>
    `;

    this.el.querySelector('.remove-btn').addEventListener('click', () => {
      this.el.remove();
      this.onRemove(this);
    });
  }

  getValues() {
    return {
      type: 'cash',
      fields: {
        amount: parseFloat(this.el.querySelector('[name=amount]').value) || 0,
        currency: this.el.querySelector('[name=currency]').value,
      },
    };
  }
}
