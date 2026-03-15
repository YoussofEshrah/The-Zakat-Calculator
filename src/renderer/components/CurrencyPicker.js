const CURRENCIES = [
  'USD', 'EGP', 'EUR', 'GBP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD',
  'JOD', 'OMR', 'TRY', 'MYR', 'IDR', 'PKR', 'INR', 'BDT',
];

export class CurrencyPicker {
  constructor(container, defaultCurrency = 'USD') {
    this.el = document.createElement('div');
    this.el.className = 'currency-picker';

    const options = CURRENCIES.map(c =>
      `<option value="${c}" ${c === defaultCurrency ? 'selected' : ''}>${c}</option>`
    ).join('');

    this.el.innerHTML = `
      <span class="currency-picker__label">Output:</span>
      <select class="currency-picker__select" id="output-currency">
        ${options}
      </select>
    `;

    container.appendChild(this.el);
  }

  getValue() {
    return this.el.querySelector('#output-currency').value;
  }

  onChange(callback) {
    this.el.querySelector('#output-currency').addEventListener('change', () => {
      callback(this.getValue());
    });
  }
}
