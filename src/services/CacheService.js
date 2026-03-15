const fs = require('fs');
const path = require('path');

class CacheService {
  constructor(cacheDir) {
    this.memoryCache = new Map();
    this.cacheDir = cacheDir;
    this.cacheFile = cacheDir ? path.join(cacheDir, 'api-cache.json') : null;
    this._loadFileCache();
  }

  _loadFileCache() {
    if (!this.cacheFile) return;
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        for (const [key, entry] of Object.entries(data)) {
          this.memoryCache.set(key, entry);
        }
      }
    } catch {
      // Ignore corrupt cache
    }
  }

  _persistToFile() {
    if (!this.cacheFile) return;
    try {
      const dir = path.dirname(this.cacheFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = Object.fromEntries(this.memoryCache);
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch {
      // Non-critical
    }
  }

  async getOrFetch(key, fetchFn, ttlMs = 3600000, validateFn = null) {
    const cached = this.memoryCache.get(key);
    const cacheValid = cached &&
      Date.now() - cached.timestamp < ttlMs &&
      (validateFn === null || validateFn(cached.data));

    if (cacheValid) {
      return { data: cached.data, fromCache: true };
    }

    try {
      const data = await fetchFn();
      this.memoryCache.set(key, { data, timestamp: Date.now() });
      this._persistToFile();
      return { data, fromCache: false };
    } catch (err) {
      // Fallback to stale cache only if it passes validation
      if (cached && (validateFn === null || validateFn(cached.data))) {
        return { data: cached.data, fromCache: true, stale: true };
      }
      throw err;
    }
  }
}

module.exports = CacheService;
