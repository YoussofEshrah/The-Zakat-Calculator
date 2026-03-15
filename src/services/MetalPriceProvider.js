const https = require('https');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

class MetalPriceProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || '';
  }

  async fetchPrices() {
    const errors = [];

    // Try metals.live first (free, no key)
    try {
      return await this._fetchFromMetalsLive();
    } catch (e) {
      errors.push(`metals.live: ${e.message}`);
    }

    // Try metalpriceapi.com (if API key provided)
    if (this.apiKey) {
      try {
        return await this._fetchFromMetalPriceAPI();
      } catch (e) {
        errors.push(`metalpriceapi: ${e.message}`);
      }
    }

    // Try frankfurter.dev as last resort (ECB data, no silver)
    try {
      return await this._fetchFromGoldAPI();
    } catch (e) {
      errors.push(`frankfurter: ${e.message}`);
    }

    throw new Error(`All metal price providers failed: ${errors.join('; ')}`);
  }

  async _fetchFromMetalPriceAPI() {
    const url = `https://api.metalpriceapi.com/v1/latest?api_key=${this.apiKey}&base=USD&currencies=XAU,XAG`;
    const data = await httpGet(url);

    if (!data.success) {
      throw new Error('MetalPriceAPI request failed');
    }

    // metalpriceapi returns USDXAU = USD per troy oz (the spot price directly)
    // Do NOT invert — USDXAU is already the gold price in USD
    const goldPerOzUSD = data.rates.USDXAU;
    const silverPerOzUSD = data.rates.USDXAG;

    return this._normalize(goldPerOzUSD, silverPerOzUSD);
  }

  async _fetchFromMetalsLive() {
    const [goldData, silverData] = await Promise.all([
      httpGet('https://api.metals.live/v1/spot/gold'),
      httpGet('https://api.metals.live/v1/spot/silver'),
    ]);

    const goldPerOzUSD = this._extractSpotPrice(goldData, 'gold');
    const silverPerOzUSD = this._extractSpotPrice(silverData, 'silver');

    return this._normalize(goldPerOzUSD, silverPerOzUSD);
  }

  // metals.live may return [{gold: 1925}, ...] or [{price: 1925}, ...] depending on endpoint version
  _extractSpotPrice(data, metalKey) {
    const item = Array.isArray(data) ? data[data.length - 1] : data;
    const price = item?.[metalKey] ?? item?.price ?? item?.rate ?? item?.value;
    const num = parseFloat(price);
    if (!isFinite(num) || num <= 0) {
      throw new Error(`Unexpected metals.live response for ${metalKey}: ${JSON.stringify(item)}`);
    }
    return num;
  }

  async _fetchFromGoldAPI() {
    // Uses frankfurter.dev to get XAU (gold oz) rate via ECB data
    // Returns: 1 XAU (troy oz) in USD
    const data = await httpGet('https://api.frankfurter.dev/v1/latest?from=XAU&to=USD');
    const goldPerOzUSD = data.rates.USD;

    // Frankfurter doesn't have silver; use a typical gold:silver ratio of ~80:1
    // This is approximate and the cache will be labeled accordingly
    const silverPerOzUSD = goldPerOzUSD / 80;

    return this._normalize(goldPerOzUSD, silverPerOzUSD);
  }

  _normalize(goldPerOzUSD, silverPerOzUSD) {
    const g = parseFloat(goldPerOzUSD);
    const s = parseFloat(silverPerOzUSD);
    if (!isFinite(g) || g <= 0) throw new Error(`Invalid gold price: ${goldPerOzUSD}`);
    if (!isFinite(s) || s <= 0) throw new Error(`Invalid silver price: ${silverPerOzUSD}`);
    return {
      goldPerOzUSD: g,
      silverPerOzUSD: s,
      goldPerGramUSD: g / 31.1035,
      silverPerGramUSD: s / 31.1035,
    };
  }
}

module.exports = MetalPriceProvider;
