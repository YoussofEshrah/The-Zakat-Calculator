export class GoldEntry {
  constructor(onRemove) {
    this.onRemove = onRemove;
    this.el = document.createElement('div');
    this.el.className = 'asset-entry asset-entry--gold';
    this.el.innerHTML = `
      <div class="asset-entry__header">
        <span class="asset-entry__label">
          <span class="asset-entry__label-icon">&#9672;</span>
          Gold
        </span>
        <button class="btn btn--danger btn--sm remove-btn" aria-label="Remove" title="Remove">&times;</button>
      </div>
      <div class="asset-entry__fields">
        <div class="field">
          <label class="field__label">Weight</label>
          <input class="field__input" type="number" name="weight" placeholder="0.00" min="0" step="0.01">
        </div>
        <div class="field">
          <label class="field__label">Unit</label>
          <select class="field__select" name="weightUnit">
            <option value="grams">Grams</option>
            <option value="oz">Troy Oz</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Purity</label>
          <select class="field__select" name="purity">
            <option value="24k">24K</option>
            <option value="22k">22K</option>
            <option value="21k">21K</option>
            <option value="18k">18K</option>
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
      type: 'gold',
      fields: {
        weight: parseFloat(this.el.querySelector('[name=weight]').value) || 0,
        weightUnit: this.el.querySelector('[name=weightUnit]').value,
        purity: this.el.querySelector('[name=purity]').value,
      },
    };
  }
}
