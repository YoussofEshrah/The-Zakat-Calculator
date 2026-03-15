const { net } = require('electron');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let data = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => { data += chunk.toString(); });
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    request.on('error', reject);

    setTimeout(() => {
      request.abort();
      reject(new Error('Request timeout'));
    }, 15000);

    request.end();
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
