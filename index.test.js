const { MemoryCachePro } = require('./index.js');

jest.useFakeTimers();

const cache = new MemoryCachePro();

describe('cache', () => {
  beforeEach(() => {
    cache.clear();
  });

  // Put
  describe('put()', () => {
    it('should allow adding a new item to the cache', () => {
      expect(() => {
        cache.put('key', 'value');
      }).not.toThrow();
    });

    it('should allow adding a new item to the cache with a timeout', () => {
      expect(() => {
        cache.put('key', 'value', 100);
      }).not.toThrow();
    });

    it('should allow adding a new item to the cache with a timeout callback', () => {
      expect(() => {
        cache.put('key', 'value', 100, () => {});
      }).not.toThrow();
    });

    it('should throw an error given a non-numeric timeout', () => {
      expect(() => {
        cache.put('key', 'value', 'foo');
      }).toThrow();
    });

    it('should throw an error given a timeout of NaN', () => {
      expect(() => {
        cache.put('key', 'value', NaN);
      }).toThrow();
    });

    it('should throw an error given a timeout of 0', () => {
      expect(() => {
        cache.put('key', 'value', 0);
      }).toThrow();
    });

    it('should throw an error given a negative timeout', () => {
      expect(() => {
        cache.put('key', 'value', -100);
      }).toThrow();
    });

    it('should throw an error given a non-function timeout callback', () => {
      expect(() => {
        cache.put('key', 'value', 100, 'foo');
      }).toThrow();
    });

    it('should cause the timeout callback to fire once the cache item expires', () => {
      const callback = jest.fn();

      cache.put('key', 'value', 1000, callback);

      jest.advanceTimersByTime(999);

      expect(callback).not.toBeCalled();

      jest.advanceTimersByTime(1);

      expect(callback).toBeCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toBeCalledWith('key', 'value');
    });

    it('should override the timeout callback on a new put() with a different timeout callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      cache.put('key', 'value', 1000, callback1);

      jest.advanceTimersByTime(999);

      cache.put('key', 'value', 1000, callback2);

      jest.advanceTimersByTime(1001);

      expect(callback1).not.toBeCalled();
      expect(callback2).toBeCalledWith('key', 'value');
    });

    it('should cancel the timeout callback on a new put() without a timeout callback', () => {
      const callback = jest.fn();

      cache.put('key', 'value', 1000, callback);

      jest.advanceTimersByTime(999);

      cache.put('key', 'value');

      jest.advanceTimersByTime(1);

      expect(callback).not.toBeCalled();
    });

    it('should return the cached value', () => {
      expect(cache.put('key', 'value')).toBe('value');
    });
  });

  // TryToDelete
  describe('tryToDelete()', () => {
    it('should return false given a key for an empty cache', () => {
      expect(cache.tryToDelete('miss')).toBe(false);
    });

    it('should return false given a key not in a non-empty cache', () => {
      cache.put('key', 'value');

      expect(cache.tryToDelete('miss')).toBe(false);
    });

    it('should return true given a key in the cache', () => {
      cache.put('key', 'value');

      expect(cache.tryToDelete('key')).toBe(true);
    });

    it('should remove the provided key from the cache', () => {
      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');
      expect(cache.tryToDelete('key')).toBe(true);
      expect(cache.get('key')).toBe(null);
    });

    it('should decrement the cache size by 1', () => {
      cache.put('key', 'value');

      expect(cache.size()).toBe(1);
      expect(cache.tryToDelete('key')).toBe(true);
      expect(cache.size()).toBe(0);
    });

    it('should not remove other keys in the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      cache.tryToDelete('key1');

      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should only delete a key from the cache once even if called multiple times in a row', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.tryToDelete('key1');
      cache.tryToDelete('key1');
      cache.tryToDelete('key1');

      expect(cache.size()).toBe(2);
    });

    it('should handle deleting keys which were previously deleted and then re-added to the cache', () => {
      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');

      cache.tryToDelete('key');

      expect(cache.get('key')).toBe(null);

      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');

      cache.tryToDelete('key');

      expect(cache.get('key')).toBe(null);
    });

    it('should return false given an non-expired key', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(999);

      expect(cache.tryToDelete('key')).toBe(false);
    });

    it('should return false given an expired key', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(1000);

      expect(cache.tryToDelete('key')).toBe(false);
    });

    it('should not cancel the timeout callback for the deleted key', () => {
      const callback = jest.fn();
      cache.put('key', 'value', 1000, callback);

      cache.tryToDelete('key');

      jest.advanceTimersByTime(1000);

      expect(callback).toBeCalled();
    });

    it('should handle deletion of many items', () => {
      const num = 1000;

      for (let i = 0; i < num; i += 1) {
        cache.put(`key-${i}`, i, 1000);
      }

      expect(cache.size()).toBe(num);

      jest.advanceTimersByTime(1000);

      expect(cache.size()).toBe(0);
    });
  });

  // Delete
  describe('delete()', () => {
    it('should return false given a key for an empty cache', () => {
      expect(cache.delete('miss')).toBe(false);
    });

    it('should return false given a key not in a non-empty cache', () => {
      cache.put('key', 'value');

      expect(cache.delete('miss')).toBe(false);
    });

    it('should return true given a key in the cache', () => {
      cache.put('key', 'value');

      expect(cache.delete('key')).toBe(true);
    });

    it('should remove the provided key from the cache', () => {
      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');
      expect(cache.delete('key')).toBe(true);
      expect(cache.get('key')).toBe(null);
    });

    it('should decrement the cache size by 1', () => {
      cache.put('key', 'value');

      expect(cache.size()).toBe(1);
      expect(cache.delete('key')).toBe(true);
      expect(cache.size()).toBe(0);
    });

    it('should not remove other keys in the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      cache.delete('key1');

      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should only delete a key from the cache once even if called multiple times in a row', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.delete('key1');
      cache.delete('key1');
      cache.delete('key1');

      expect(cache.size()).toBe(2);
    });

    it('should handle deleting keys which were previously deleted and then re-added to the cache', () => {
      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');

      cache.delete('key');

      expect(cache.get('key')).toBe(null);

      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');

      cache.delete('key');

      expect(cache.get('key')).toBe(null);
    });

    it('should return true given an non-expired key', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(999);

      expect(cache.delete('key')).toBe(true);
    });

    it('should return true given an expired key', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(1000);

      expect(cache.delete('key')).toBe(false);
    });

    it('should cancel the timeout callback for the deleted key', () => {
      const callback = jest.fn();
      cache.put('key', 'value', 1000, callback);

      cache.delete('key');

      jest.advanceTimersByTime(1000);

      expect(callback).not.toBeCalled();
    });
  });

  // Clear
  describe('clear()', () => {
    it('should have no effect given an empty cache', () => {
      expect(cache.size()).toBe(0);

      cache.clear();

      expect(cache.size()).toBe(0);
    });

    it('should remove all existing keys in the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
    });

    it('should remove the keys in the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');

      cache.clear();

      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
      expect(cache.get('key3')).toBe(null);
    });

    it('should reset the cache size to 0', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
    });

    it('should reset the debug cache hits', () => {
      cache.debug(true);
      cache.put('key', 'value');
      cache.get('key');

      expect(cache.hits()).toBe(1);

      cache.clear();

      expect(cache.hits()).toBe(0);
    });

    it('should reset the debug cache misses', () => {
      cache.debug(true);
      cache.put('key', 'value');
      cache.get('miss1');

      expect(cache.misses()).toBe(1);

      cache.clear();

      expect(cache.misses()).toBe(0);
    });

    it('should cancel the timeout callbacks for all existing keys', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      cache.put('key1', 'value1', 1000, callback1);
      cache.put('key2', 'value2', 1000, callback2);
      cache.put('key3', 'value3', 1000, callback3);

      cache.clear();

      jest.advanceTimersByTime(1000);

      expect(callback1).not.toBeCalled();
      expect(callback2).not.toBeCalled();
      expect(callback3).not.toBeCalled();
    });
  });

  // Get
  describe('get()', () => {
    it('should return null given a key for an empty cache', () => {
      expect(cache.get('miss')).toBe(null);
    });

    it('should return null given a key not in a non-empty cache', () => {
      cache.put('key', 'value');

      expect(cache.get('miss')).toBe(null);
    });

    it('should return the corresponding value of a key in the cache', () => {
      cache.put('key', 'value');

      expect(cache.get('key')).toBe('value');
    });

    it('should return the latest corresponding value of a key in the cache', () => {
      cache.put('key', 'value1');
      cache.put('key', 'value2');
      cache.put('key', 'value3');

      expect(cache.get('key')).toBe('value3');
    });

    it('should handle constious types of cache keys', () => {
      const keys = [
        null,
        undefined,
        NaN,
        true,
        false,
        0,
        1,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        '',
        'a',
        [],
        {},
        [1, 'a', false],
        { a: 1, b: 'a', c: false },
        () => {},
      ];

      keys.forEach((key, index) => {
        const value = `value${index}`;
        cache.put(key, value);
        expect(cache.get(key)).toEqual(value);
      });
    });

    it('should handle constious types of cache values', () => {
      const values = [
        null,
        undefined,
        NaN,
        true,
        false,
        0,
        1,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        '',
        'a',
        [],
        {},
        [1, 'a', false],
        { a: 1, b: 'a', c: false },
        () => {},
      ];

      values.forEach((value, index) => {
        const key = `key${index}`;

        cache.put(key, value);

        expect(cache.get(key)).toEqual(value);
      });
    });

    it('should not set a timeout given no expiration time', () => {
      cache.put('key', 'value');

      jest.advanceTimersByTime(1000);

      expect(cache.get('key')).toBe('value');
    });

    it('should return the corresponding value of a non-expired key in the cache', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(999);

      expect(cache.get('key')).toBe('value');
    });

    it('should return null given an expired key', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(1000);

      expect(cache.get('key')).toBe(null);
    });

    it('should return null given an expired key 2', () => {
      cache.put('key', 'value', 1000);

      jest.advanceTimersByTime(1000);

      expect(cache.get('key')).toBe(null);
    });

    it('should return null given a key which is a property on the Object prototype', () => {
      expect(cache.get('toString')).toBe(null);
    });

    it('should allow reading the value for a key which is a property on the Object prototype', () => {
      cache.put('toString', 'value');

      expect(cache.get('toString')).toBe('value');
    });
  });

  // Size
  describe('size()', () => {
    it('should return 0 given a fresh cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return 1 after adding a single item to the cache', () => {
      cache.put('key', 'value');

      expect(cache.size()).toBe(1);
    });

    it('should return 3 after adding three items to the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.size()).toBe(3);
    });

    it('should not multi-count duplicate items added to the cache', () => {
      cache.put('key', 'value1');
      expect(cache.size()).toBe(1);

      cache.put('key', 'value2');
      expect(cache.size()).toBe(1);
    });

    it('should update when a key in the cache expires', () => {
      cache.put('key', 'value', 1000);
      expect(cache.size()).toBe(1);

      jest.advanceTimersByTime(999);

      expect(cache.size()).toBe(1);

      jest.advanceTimersByTime(1);
      expect(cache.size()).toBe(0);
    });
  });

  // Memsize
  describe('memsize()', () => {
    it('should return 0 given a fresh cache', () => {
      expect(cache.memsize()).toBe(0);
    });

    it('should return 1 after adding a single item to the cache', () => {
      cache.put('key', 'value');

      expect(cache.memsize()).toBe(1);
    });

    it('should return 3 after adding three items to the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.memsize()).toBe(3);
    });

    it('should not multi-count duplicate items added to the cache', () => {
      cache.put('key', 'value1');
      expect(cache.memsize()).toBe(1);

      cache.put('key', 'value2');
      expect(cache.memsize()).toBe(1);
    });

    it('should update when a key in the cache expires', () => {
      cache.put('key', 'value', 1000);
      expect(cache.memsize()).toBe(1);

      jest.advanceTimersByTime(999);

      expect(cache.memsize()).toBe(1);

      jest.advanceTimersByTime(1);

      expect(cache.memsize()).toBe(0);
    });
  });

  // Debug
  describe('debug()', () => {
    it('should not count cache hits when false', () => {
      cache.debug(false);
      cache.put('key', 'value');
      cache.get('key');

      expect(cache.hits()).toBe(0);
    });

    it('should not count cache misses when false', () => {
      cache.debug(false);
      cache.put('key', 'value');
      cache.get('miss1');

      expect(cache.misses()).toBe(0);
    });

    it('should count cache hits when true', () => {
      cache.debug(true);
      cache.put('key', 'value');
      cache.get('key');

      expect(cache.hits()).toBe(1);
    });

    it('should count cache misses when true', () => {
      cache.debug(true);
      cache.put('key', 'value');
      cache.get('miss1');

      expect(cache.misses()).toBe(1);
    });
  });

  // Hits
  describe('hits()', () => {
    beforeEach(() => {
      cache.debug(true);
    });

    it('should return 0 given an empty cache', () => {
      expect(cache.hits()).toBe(0);
    });

    it('should return 0 given a non-empty cache which has not been accessed', () => {
      cache.put('key', 'value');

      expect(cache.hits()).toBe(0);
    });

    it('should return 0 given a non-empty cache which has had only misses', () => {
      cache.put('key', 'value');
      cache.get('miss1');
      cache.get('miss2');
      cache.get('miss3');

      expect(cache.hits()).toBe(0);
    });

    it('should return 1 given a non-empty cache which has had a single hit', () => {
      cache.put('key', 'value');
      cache.get('key');

      expect(cache.hits()).toBe(1);
    });

    it('should return 3 given a non-empty cache which has had three hits on the same key', () => {
      cache.put('key', 'value');
      cache.get('key');
      cache.get('key');
      cache.get('key');

      expect(cache.hits()).toBe(3);
    });

    it('should return 3 given a non-empty cache which has had three hits across many keys', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');
      cache.get('key1');
      cache.get('key2');
      cache.get('key3');

      expect(cache.hits()).toBe(3);
    });

    it('should return the correct value after a sequence of hits and misses', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');
      cache.get('key1');
      cache.get('miss');
      cache.get('key3');

      expect(cache.hits()).toBe(2);
    });

    it('should not count hits for expired keys', () => {
      cache.put('key', 'value', 1000);
      cache.get('key');
      expect(cache.hits()).toBe(1);

      jest.advanceTimersByTime(999);

      cache.get('key');
      expect(cache.hits()).toBe(2);

      jest.advanceTimersByTime(1);

      cache.get('key');
      expect(cache.hits()).toBe(2);
    });
  });

  // Misses
  describe('misses()', () => {
    beforeEach(() => {
      cache.debug(true);
    });

    it('should return 0 given an empty cache', () => {
      expect(cache.misses()).toBe(0);
    });

    it('should return 0 given a non-empty cache which has not been accessed', () => {
      cache.put('key', 'value');

      expect(cache.misses()).toBe(0);
    });

    it('should return 0 given a non-empty cache which has had only hits', () => {
      cache.put('key', 'value');
      cache.get('key');
      cache.get('key');
      cache.get('key');

      expect(cache.misses()).toBe(0);
    });

    it('should return 1 given a non-empty cache which has had a single miss', () => {
      cache.put('key', 'value');
      cache.get('miss');

      expect(cache.misses()).toBe(1);
    });

    it('should return 3 given a non-empty cache which has had three misses', () => {
      cache.put('key', 'value');
      cache.get('miss1');
      cache.get('miss2');
      cache.get('miss3');

      expect(cache.misses()).toBe(3);
    });

    it('should return the correct value after a sequence of hits and misses', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');
      cache.get('key1');
      cache.get('miss');
      cache.get('key3');

      expect(cache.misses()).toBe(1);
    });

    it('should count misses for expired keys', () => {
      cache.put('key', 'value', 1000);
      cache.get('key');
      expect(cache.misses()).toBe(0);

      jest.advanceTimersByTime(999);

      cache.get('key');
      expect(cache.misses()).toBe(0);

      jest.advanceTimersByTime(1);

      cache.get('key');
      expect(cache.misses()).toBe(1);
    });
  });

  // Keys
  describe('keys()', () => {
    it('should return an empty array given an empty cache', () => {
      expect(cache.keys()).toEqual([]);
    });

    it('should return a single key after adding a single item to the cache', () => {
      cache.put('key', 'value');

      expect(cache.keys()).toEqual(['key']);
    });

    it('should return 3 keys after adding three items to the cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2');
      cache.put('key3', 'value3');

      expect(cache.keys()).toEqual(['key1', 'key2', 'key3']);
    });

    it('should not multi-count duplicate items added to the cache', () => {
      cache.put('key', 'value1');
      expect(cache.keys()).toEqual(['key']);

      cache.put('key', 'value2');
      expect(cache.keys()).toEqual(['key']);
    });

    it('should update when a key in the cache expires', () => {
      cache.put('key', 'value', 1000);
      expect(cache.keys()).toEqual(['key']);

      jest.advanceTimersByTime(999);

      expect(cache.keys()).toEqual(['key']);

      jest.advanceTimersByTime(1);

      expect(cache.keys()).toEqual([]);
    });
  });

  // Export
  describe('export()', () => {
    // let dateNowSpy; => dateNowSpy()

    beforeAll(() => {
      // Lock Time
      // dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1);
      jest.spyOn(Date, 'now').mockImplementation(() => 1642763135352);
    });

    afterAll(() => {
      // Unlock Time
      // dateNowSpy.mockRestore();
      // Date.now.mockRestore() or below
      jest.spyOn(Date, 'now').mockRestore();
    });

    const getBasicExport = () =>
      JSON.stringify({
        key: {
          value: 'value',
          expire: Date.now() + 1000,
        },
      });

    it('should return an empty object given an empty cache', () => {
      expect(cache.exportToJSON()).toBe(JSON.stringify({}));
    });

    it('should return a single record after adding a single item to the cache', () => {
      cache.put('key', 'value', 1000);

      expect(cache.exportToJSON()).toBe(getBasicExport());
    });

    it('should return multiple records with expiry', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2', 1000);

      expect(cache.exportToJSON()).toBe(
        JSON.stringify({
          key1: {
            value: 'value1',
            expire: 'NaN',
          },
          key2: {
            value: 'value2',
            expire: Date.now() + 1000,
          },
        })
      );
    });

    it('should update when a key in the cache expires', () => {
      cache.put('key', 'value', 1000);
      expect(cache.exportToJSON()).toBe(getBasicExport());

      jest.advanceTimersByTime(999);

      expect(cache.exportToJSON()).toBe(getBasicExport());

      jest.advanceTimersByTime(1);

      expect(cache.exportToJSON()).toBe(JSON.stringify({}));
    });
  });

  // Import
  describe('import()', () => {
    beforeAll(() => {
      jest.spyOn(Date, 'now').mockImplementation(() => 1642772310981);
    });

    afterAll(() => {
      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should import an empty object into an empty cache', () => {
      const exportedJSON = cache.exportToJSON();

      cache.clear();

      cache.importFromJSON(exportedJSON);

      expect(cache.exportToJSON()).toBe(JSON.stringify({}));
    });

    it('should import records into an empty cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2', 1000);

      const exportedJSON = cache.exportToJSON();

      cache.clear();
      cache.importFromJSON(exportedJSON);

      expect(cache.exportToJSON()).toBe(
        JSON.stringify({
          key1: {
            value: 'value1',
            expire: 'NaN',
          },
          key2: {
            value: 'value2',
            expire: Date.now() + 1000,
          },
        })
      );
    });

    it('should import records into an already-existing cache', () => {
      cache.put('key1', 'value1');
      cache.put('key2', 'value2', 1000);

      const exportedJSON = cache.exportToJSON();

      cache.put('key1', 'changed value', 5000);
      cache.put('key3', 'value3', 500);

      cache.importFromJSON(exportedJSON);

      expect(cache.exportToJSON()).toBe(
        JSON.stringify({
          key1: {
            value: 'value1',
            expire: 'NaN',
          },
          key2: {
            value: 'value2',
            expire: Date.now() + 1000,
          },
          key3: {
            value: 'value3',
            expire: Date.now() + 500,
          },
        })
      );
    });

    it('should import records into an already-existing cache and skip duplicates', () => {
      cache.debug(true);

      cache.put('key1', 'value1');
      cache.put('key2', 'value2', 1000);

      const exportedJSON = cache.exportToJSON();

      cache.clear();

      cache.put('key1', 'changed value', 5000);
      cache.put('key3', 'value3', 500);

      cache.importFromJSON(exportedJSON, { skipDuplicates: true });

      expect(cache.exportToJSON()).toBe(
        JSON.stringify({
          key1: {
            value: 'changed value',
            expire: Date.now() + 5000,
          },
          key3: {
            value: 'value3',
            expire: Date.now() + 500,
          },
          key2: {
            value: 'value2',
            expire: Date.now() + 1000,
          },
        })
      );
    });

    it('should import with updated expire times', () => {
      const dateNow = Date.now();

      cache.put('key1', 'value1', 500);
      cache.put('key2', 'value2', 1000);

      const exportedJSON = cache.exportToJSON();

      const tickAmount = 750;

      jest.spyOn(Date, 'now').mockImplementation(() => dateNow + tickAmount);

      cache.importFromJSON(exportedJSON);

      expect(cache.exportToJSON()).toBe(
        JSON.stringify({
          key2: {
            value: 'value2',
            expire: Date.now() + 250,
          },
        })
      );
    });

    it('should return the new size', () => {
      cache.put('key1', 'value1', 500);
      const exportedJSON = cache.exportToJSON();

      cache.clear();

      cache.put('key2', 'value2', 1000);
      expect(cache.size()).toBe(1);

      const size = cache.importFromJSON(exportedJSON);

      expect(size).toBe(2);
      expect(cache.size()).toBe(2);
    });
  });

  // MemoryCachePro
  describe('MemoryCachePro()', () => {
    it('should return a new cache instance when called', () => {
      const cache1 = new MemoryCachePro();
      const cache2 = new MemoryCachePro();

      cache1.put('key', 'value1');

      expect(cache1.keys()).toEqual(['key']);
      expect(cache2.keys()).toEqual([]);

      cache2.put('key', 'value2');

      expect(cache1.get('key')).toBe('value1');
      expect(cache2.get('key')).toBe('value2');
    });
  });
});
