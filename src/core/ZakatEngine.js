const { ZAKAT_RATE, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } = require('./constants');
const { getAssetType } = require('./AssetTypes');

class ZakatEngine {
  /**
   * Calculate Zakat based on assets, prices, and exchange rates.
   * Each category (gold, silver, cash) is evaluated independently against its own Nisab.
   *
   * @param {Object} params
   * @param {Array}  params.assets         - Array of { type, fields } objects
   * @param {Object} params.metalPrices    - { goldPerGramUSD, silverPerGramUSD }
   * @param {Object} params.exchangeRates  - { USD: 1, EGP: 50.5, ... } (rates relative to USD)
   * @param {string} params.outputCurrency - e.g. 'EGP'
   * @returns {Object} result
   */
  static calculate({ assets, metalPrices, exchangeRates, outputCurrency }) {
    const outputRate = exchangeRates[outputCurrency] || 1;

    // Group assets by category
    const categories = { gold: [], silver: [], cash: [] };
    const breakdown = [];

    for (const asset of assets) {
      const typeDef = getAssetType(asset.type);
      if (!typeDef) continue;

      const valueUSD = typeDef.computeValueUSD(asset.fields, metalPrices, exchangeRates);
      const valueOutput = valueUSD * outputRate;

      const entry = {
        type: asset.type,
        label: typeDef.label,
        fields: { ...asset.fields },
        valueUSD,
        valueOutput,
        category: typeDef.category,
        zakatDue: 0,
      };

      // Track pure grams for Nisab check on metals
      if (typeDef.getPureGrams) {
        entry.pureGrams = typeDef.getPureGrams(asset.fields);
      }

      breakdown.push(entry);

      const cat = typeDef.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(entry);
    }

    // --- Nisab checks per category ---

    // Gold Nisab: total pure grams >= 85g
    const goldTotalPureGrams = categories.gold.reduce((sum, e) => sum + (e.pureGrams || 0), 0);
    const goldTotalValueUSD = categories.gold.reduce((sum, e) => sum + e.valueUSD, 0);
    const goldNisabMet = goldTotalPureGrams >= NISAB_GOLD_GRAMS;
    const goldZakatUSD = goldNisabMet ? goldTotalValueUSD * ZAKAT_RATE : 0;

    if (goldNisabMet) {
      for (const entry of categories.gold) {
        entry.zakatDue = entry.valueOutput * ZAKAT_RATE;
      }
    }

    // Silver Nisab: total pure grams >= 595g
    const silverTotalPureGrams = categories.silver.reduce((sum, e) => sum + (e.pureGrams || 0), 0);
    const silverTotalValueUSD = categories.silver.reduce((sum, e) => sum + e.valueUSD, 0);
    const silverNisabMet = silverTotalPureGrams >= NISAB_SILVER_GRAMS;
    const silverZakatUSD = silverNisabMet ? silverTotalValueUSD * ZAKAT_RATE : 0;

    if (silverNisabMet) {
      for (const entry of categories.silver) {
        entry.zakatDue = entry.valueOutput * ZAKAT_RATE;
      }
    }

    // Cash Nisab: total cash in USD >= value of 85g pure gold in USD
    const cashNisabUSD = NISAB_GOLD_GRAMS * metalPrices.goldPerGramUSD;
    const cashTotalUSD = categories.cash.reduce((sum, e) => sum + e.valueUSD, 0);
    const cashNisabMet = cashTotalUSD >= cashNisabUSD;
    const cashZakatUSD = cashNisabMet ? cashTotalUSD * ZAKAT_RATE : 0;

    if (cashNisabMet) {
      for (const entry of categories.cash) {
        entry.zakatDue = entry.valueOutput * ZAKAT_RATE;
      }
    }

    // Total
    const totalZakatUSD = goldZakatUSD + silverZakatUSD + cashZakatUSD;
    const totalZakatOutput = totalZakatUSD * outputRate;
    const totalWealthUSD = goldTotalValueUSD + silverTotalValueUSD + cashTotalUSD;
    const totalWealthOutput = totalWealthUSD * outputRate;

    return {
      outputCurrency,
      totalWealth: totalWealthOutput,
      totalZakat: totalZakatOutput,
      breakdown,
      categories: {
        gold: {
          totalPureGrams: goldTotalPureGrams,
          nisabGrams: NISAB_GOLD_GRAMS,
          nisabMet: goldNisabMet,
          totalValue: goldTotalValueUSD * outputRate,
          zakatDue: goldZakatUSD * outputRate,
        },
        silver: {
          totalPureGrams: silverTotalPureGrams,
          nisabGrams: NISAB_SILVER_GRAMS,
          nisabMet: silverNisabMet,
          totalValue: silverTotalValueUSD * outputRate,
          zakatDue: silverZakatUSD * outputRate,
        },
        cash: {
          nisabValueOutput: cashNisabUSD * outputRate,
          nisabMet: cashNisabMet,
          totalValue: cashTotalUSD * outputRate,
          zakatDue: cashZakatUSD * outputRate,
        },
      },
    };
  }
}

module.exports = ZakatEngine;
