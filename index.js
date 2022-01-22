const has = Object.prototype.hasOwnProperty;

class MemoryCachePro {
  constructor() {
    this._cache = {};
    this._hitCount = 0;
    this._missCount = 0;
    this._size = 0;
    this._debug = false;
  }

  /**
   * This method stores a value in the cache
   *
   * @param {string} key - Key in the cache
   * @param {any} value - Value
   * @param {number} time - Expiration time in ms
   * @param {function} timeoutCallback - Timeout callback
   * @returns {any} Cached value
   */
  put(key, value, time, timeoutCallback) {
    if (this._debug) {
      console.log('caching: %s = %j (@%s)', key, value, time);
    }

    if (
      typeof time !== 'undefined' &&
      (typeof time !== 'number' || Number.isNaN(time) || time <= 0)
    ) {
      throw new Error('Cache timeout must be a positive number');
    }

    if (
      typeof timeoutCallback !== 'undefined' &&
      typeof timeoutCallback !== 'function'
    ) {
      throw new Error('Cache timeout callback must be a function');
    }

    const oldRecord = this._cache[key];

    if (oldRecord) {
      clearTimeout(oldRecord.timeout);
    }

    if (!oldRecord) {
      this._size += 1;
    }

    const record = {
      value,
      expire: Date.now() + time,
    };

    const isValidExpireTime = !Number.isNaN(record.expire);

    if (isValidExpireTime) {
      record.timeout = setTimeout(
        function deleteByKeyAfterTime() {
          this._delete(key);

          if (timeoutCallback) {
            timeoutCallback(key, value);
          }
        }.bind(this),
        time
      );
    }

    this._cache[key] = record;

    return value;
  }

  /**
   * This method tries to delete a key in the cache
   *
   * @param {string} key - Key
   * @returns {boolean} True if the record was deleted
   */
  tryToDelete(key) {
    let canDelete = true;

    const oldRecord = this._cache[key];

    if (oldRecord) {
      const isValidExpireTime = !Number.isNaN(oldRecord.expire);
      const notExpired = oldRecord.expire > Date.now();

      if (isValidExpireTime && notExpired) {
        canDelete = false;
      }
    }

    if (!oldRecord) {
      canDelete = false;
    }

    if (canDelete) {
      clearTimeout(oldRecord.timeout);

      this._delete(key);
    }

    return canDelete;
  }

  /**
   * This function deletes a key in the cache
   *
   * @param {string} key - Record key
   * @returns {boolean} False if the record does not exist or true if it was deleted
   */
  delete(key) {
    const oldRecord = this._cache[key];

    if (!oldRecord) {
      return false;
    }

    clearTimeout(oldRecord.timeout);

    this._delete(key);

    return true;
  }

  /**
   * @private
   * @param {string} key - Key
   */
  _delete(key) {
    this._size -= 1;
    delete this._cache[key];
  }

  /**
   * This method clears (deletes) all keys in the storage
   */
  clear() {
    const keys = Object.keys(this._cache);

    keys.forEach((key) => {
      const { timeout } = this._cache[key];

      clearTimeout(timeout);
    });

    this._size = 0;
    this._cache = {};

    if (this._debug) {
      this._hitCount = 0;
      this._missCount = 0;
    }
  }

  /**
   * This method gets the value by a key from the cache
   *
   * @param {string} key - Key
   * @returns {any | null} Cached value or null
   */
  get(key) {
    const data = this._cache[key];

    if (typeof data === 'undefined') {
      if (this._debug) {
        this._missCount += 1;
      }

      return null;
    }

    const isValidExpireTime = Number.isNaN(data.expire);
    const expired = data.expire >= Date.now();

    if (isValidExpireTime || expired) {
      if (this._debug) {
        this._hitCount += 1;
      }

      return data.value;
    }

    // free some space
    if (this._debug) {
      this._missCount += 1;
    }

    this._size -= 1;
    delete this._cache[key];

    return null;
  }

  /**
   * This method gets the number of entries in the cache
   *
   * @returns {number} Number of entries
   */
  size() {
    return this._size;
  }

  /**
   * This method turns on or off debugging
   *
   * @param {boolean} boolean - Debug status
   */
  debug(status) {
    this._debug = status;
  }

  /**
   * This method gets the number of cache misses (only monitored in debug mode)
   *
   * @returns {number} Number of misses
   */
  misses() {
    return this._missCount;
  }

  /**
   * This method gets the number of cache hits (only monitored in debug mode)
   *
   * @returns {number} Number of hits
   */
  hits() {
    return this._hitCount;
  }

  /**
   * This method gets the number of entries taking up space in the cache
   *
   * @returns {number} Number of entries taking up space
   */
  memsize() {
    const size = Object.keys(this._cache).length;

    return size;
  }

  /**
   * This method gets all the cache keys
   *
   * @returns {Array} Cache keys
   */
  keys() {
    return Object.keys(this._cache);
  }

  /**
   * This method gets a JSON string representing all the cache data
   *
   * @returns {string} JSON string
   */
  exportToJSON() {
    const plainJSCache = {};

    // Discard the `timeout` property.
    // Note: JSON doesn't support `NaN`, so convert it to `'NaN'`
    const keys = Object.keys(this._cache);

    keys.forEach((key) => {
      const { value, expire } = this._cache[key];

      plainJSCache[key] = { value, expire: expire || 'NaN' };
    });

    return JSON.stringify(plainJSCache);
  }

  /**
   * This method merges all the data from an export JSON into the cache
   *
   * @param {string} JSONToImport - JSON to import
   * @param {Object} options - Object with options: skipDuplicates (boolean)
   * @returns {number} New size of the cache
   */
  importFromJSON(JSONToImport, options) {
    const cacheToImport = JSON.parse(JSONToImport);
    const currentTime = Date.now();

    const skipDuplicates = options && options.skipDuplicates;

    const keys = Object.keys(cacheToImport);

    keys.forEach((key) => {
      if (!has.call(cacheToImport, key)) {
        return;
      }

      if (skipDuplicates) {
        const existingRecord = this._cache[key];

        if (existingRecord) {
          if (this._debug) {
            console.log("Skipping duplicate imported key '%s'", key);
          }

          return;
        }
      }

      const record = cacheToImport[key];

      // record.expire could be `'NaN'` if no expiry was set
      // Try to subtract from it; a string minus a number is `NaN`, which is perfectly fine here
      const remainingTime = record.expire - currentTime;

      if (remainingTime <= 0) {
        // Delete any record that might exist with the same key, since this key is expired
        this._delete(key);

        return;
      }

      const remainingTimeValue = remainingTime > 0 ? remainingTime : undefined;

      this.put(key, record.value, remainingTimeValue);
    });

    return this.size();
  }
}

module.exports = new MemoryCachePro();
module.exports.MemoryCachePro = MemoryCachePro;
