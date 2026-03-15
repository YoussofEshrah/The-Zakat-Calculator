const CacheService = require('./CacheService');
const MetalPriceProvider = require('./MetalPriceProvider');
const CurrencyProvider = require('./CurrencyProvider');

class ApiManager {
  constructor(cacheDir, metalApiKey) {
    this.cache = new CacheService(cacheDir);
    this.metalProvider = new MetalPriceProvider(metalApiKey);
    this.currencyProvider = new CurrencyProvider();
  }

  async fetchAllPrices() {
    const [metals, rates] = await Promise.all([
      this.cache.getOrFetch(
        'metals',
        () => this.metalProvider.fetchPrices(),
        3600000,
        // Require realistic prices: gold > $10/gram, silver > $0.10/gram
        // Prevents inverted/corrupted cached values from being served
        (d) => d != null
          && isFinite(d.goldPerGramUSD) && d.goldPerGramUSD > 10
          && isFinite(d.silverPerGramUSD) && d.silverPerGramUSD > 0.1
      ),
      this.cache.getOrFetch('rates', () => this.currencyProvider.fetchRates(), 3600000),
    ]);

    return {
      metalPrices: metals.data,
      exchangeRates: rates.data,
      fromCache: metals.fromCache && rates.fromCache,
      stale: metals.stale || rates.stale || false,
    };
  }
}

module.exports = ApiManager;
