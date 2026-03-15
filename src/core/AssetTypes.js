const { GOLD_PURITIES, SILVER_PURITIES, TROY_OZ_TO_GRAMS } = require('./constants');

const assetTypeRegistry = new Map();

function registerAssetType(typeId, definition) {
  assetTypeRegistry.set(typeId, definition);
}

function getAssetType(typeId) {
  return assetTypeRegistry.get(typeId);
}

function getAllAssetTypes() {
  return Array.from(assetTypeRegistry.entries()).map(([id, def]) => ({ id, ...def }));
}

// --- Gold ---
registerAssetType('gold', {
  label: 'Gold',
  category: 'gold',
  fields: [
    { name: 'weight', type: 'number', label: 'Weight', required: true, min: 0, step: 0.01 },
    { name: 'weightUnit', type: 'select', label: 'Unit', options: [
      { value: 'grams', label: 'Grams' },
      { value: 'oz', label: 'Troy Oz' },
    ], default: 'grams' },
    { name: 'purity', type: 'select', label: 'Purity', options: Object.keys(GOLD_PURITIES).map(k => ({
      value: k, label: k.toUpperCase(),
    })), default: '24k' },
  ],
  getPureGrams(fields) {
    const weightInGrams = fields.weightUnit === 'oz'
      ? fields.weight * TROY_OZ_TO_GRAMS
      : fields.weight;
    const purityFactor = GOLD_PURITIES[fields.purity] || 1;
    return weightInGrams * purityFactor;
  },
  computeValueUSD(fields, prices) {
    const pureGrams = this.getPureGrams(fields);
    return pureGrams * prices.goldPerGramUSD;
  },
});

// --- Silver ---
registerAssetType('silver', {
  label: 'Silver',
  category: 'silver',
  fields: [
    { name: 'weight', type: 'number', label: 'Weight', required: true, min: 0, step: 0.01 },
    { name: 'weightUnit', type: 'select', label: 'Unit', options: [
      { value: 'grams', label: 'Grams' },
      { value: 'oz', label: 'Troy Oz' },
    ], default: 'grams' },
    { name: 'purity', type: 'select', label: 'Purity', options: Object.keys(SILVER_PURITIES).map(k => ({
      value: k, label: `${k} Fine`,
    })), default: '999' },
  ],
  getPureGrams(fields) {
    const weightInGrams = fields.weightUnit === 'oz'
      ? fields.weight * TROY_OZ_TO_GRAMS
      : fields.weight;
    const purityFactor = SILVER_PURITIES[fields.purity] || 1;
    return weightInGrams * purityFactor;
  },
  computeValueUSD(fields, prices) {
    const pureGrams = this.getPureGrams(fields);
    return pureGrams * prices.silverPerGramUSD;
  },
});

// --- Cash ---
registerAssetType('cash', {
  label: 'Cash & Savings',
  category: 'cash',
  fields: [
    { name: 'amount', type: 'number', label: 'Amount', required: true, min: 0, step: 0.01 },
    { name: 'currency', type: 'currency', label: 'Currency', default: 'USD' },
  ],
  computeValueUSD(fields, prices, exchangeRates) {
    const rate = exchangeRates[fields.currency];
    if (!rate) return 0;
    return fields.amount / rate;
  },
});

module.exports = { registerAssetType, getAssetType, getAllAssetTypes };
