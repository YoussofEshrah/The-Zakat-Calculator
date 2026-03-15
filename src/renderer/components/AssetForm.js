import { GoldEntry } from './GoldEntry.js';
import { SilverEntry } from './SilverEntry.js';
import { CashEntry } from './CashEntry.js';

const ENTRY_TYPES = {
  gold: { Component: GoldEntry, label: 'Gold', icon: '&#9672;' },
  silver: { Component: SilverEntry, label: 'Silver', icon: '&#9673;' },
  cash: { Component: CashEntry, label: 'Cash', icon: '&#36;' },
};

export class AssetForm {
  constructor(container) {
    this.entries = [];
    this.el = document.createElement('div');
    this.el.className = 'asset-form';

    // Add-buttons row
    this.buttonsEl = document.createElement('div');
    this.buttonsEl.className = 'asset-buttons';

    for (const [type, { label, icon }] of Object.entries(ENTRY_TYPES)) {
      const btn = document.createElement('button');
      btn.className = 'btn btn--outline';
      btn.innerHTML = `${icon}&nbsp; Add ${label}`;
      btn.addEventListener('click', () => this.addEntry(type));
      this.buttonsEl.appendChild(btn);
    }

    // Entry list container
    this.listEl = document.createElement('div');
    this.listEl.className = 'asset-form__list';

    // Placeholder
    this.placeholderEl = document.createElement('div');
    this.placeholderEl.className = 'no-entries';
    this.placeholderEl.innerHTML = `
      <div class="no-entries__icon">&#43;</div>
      <div class="no-entries__text">Add your assets above to get started</div>
    `;

    this.el.appendChild(this.buttonsEl);
    this.el.appendChild(this.listEl);
    this.el.appendChild(this.placeholderEl);

    container.appendChild(this.el);
    this._updatePlaceholder();
  }

  addEntry(type) {
    const { Component } = ENTRY_TYPES[type];
    const entry = new Component((removed) => {
      this.entries = this.entries.filter(e => e !== removed);
      this._updatePlaceholder();
    });
    this.entries.push(entry);
    this.listEl.appendChild(entry.el);
    this._updatePlaceholder();

    // Focus the first input in the new entry
    const firstInput = entry.el.querySelector('input[type="number"]');
    if (firstInput) firstInput.focus();
  }

  getAllValues() {
    return this.entries
      .map(e => e.getValues())
      .filter(v => {
        // Filter out entries with no meaningful value
        if (v.fields.weight !== undefined) return v.fields.weight > 0;
        if (v.fields.amount !== undefined) return v.fields.amount > 0;
        return false;
      });
  }

  _updatePlaceholder() {
    this.placeholderEl.style.display = this.entries.length === 0 ? '' : 'none';
  }
}
