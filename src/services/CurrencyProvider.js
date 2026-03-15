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

class CurrencyProvider {
  async fetchRates() {
    // open.er-api.com — free, no API key, no sign-up
    const data = await httpGet('https://open.er-api.com/v6/latest/USD');

    if (data.result !== 'success') {
      throw new Error('ExchangeRate API request failed');
    }

    return data.rates; // { USD: 1, EGP: 50.5, EUR: 0.87, ... }
  }
}

module.exports = CurrencyProvider;
