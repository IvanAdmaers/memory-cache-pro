# Memory Cache Pro

A modern excellent fast well-tested reliable **Caching Module** that allows to keep your data in cache and incredibly fast to get it

<div align="center">
  <a href="https://www.npmjs.com/package/memory-cache-pro">
    <img alt="npm version" src="https://img.shields.io/npm/v/memory-cache-pro" />
  </a>
  <a href="https://www.npmjs.com/package/memory-cache-pro">
    <img alt="npm downloads" src="https://img.shields.io/npm/dm/memory-cache-pro" />
  </a>
</div>

![Memory Cache Pro Logo](https://i.ibb.co/nb4bJ0L/memory-cache-pro.jpg)

## Installation

```bash
npm i memory-cache-pro
```

## Usage

```javascript
import cache from 'memory-cache-pro';

/* Example 1 */

cache.put('John', 'Smith');
cache.get('John'); // Smith

/* Example 2 */

cache.put('superSecretKey', 'deleteItIn5Seconds', 5 * 1000);
cache.get('superSecretKey'); // deleteItIn5Seconds

setTimeout(() => {
  cache.get('superSecretKey'); // null
}, 5 * 1000);

/* Example 3 */

cache.put(
  'mySocksAreUnderTheCouch',
  'notifyMeAboutItIn5Seconds',
  5 * 1000,
  (key, value) => {
    console.log('Your socks 🧦🧦 are under the couch');
  }
);

/* Example 4 */

import { MemoryCachePro } from 'memory-cache-pro';

const myDogCache = new MemoryCachePro();
const myCatCache = new MemoryCachePro();

myDogCache.put('rule', 'StopEatMySlippers!');
myCatCache.put('rule', 'DoNotOpenMyFridge!');

myDogCache.get('rule'); // StopEatMySlippers!
myCatCache.get('rule'); // DoNotOpenMyFridge!
```
## API

### put(key, value, time, timeoutCallback)

* Stores a value
* If time isn't passed in, it is stored forever
* Will actually remove the value in the specified time in ms (via `setTimeout`)
* timeoutCallback is optional function fired after entry has expired with key and value passed (`key, value`)
* Returns the cached value

### get(key)

* Retrieves a value for a given key
* If value isn't cached, returns `null`

### delete(key)

* Deletes a key, returns a boolean specifying whether or not the key was deleted. `False` when the key doesn't exist. `True` when the key was deleted

### tryToDelete(key)

* Deletes a key, returns a boolean specifying whether or not the key was deleted. It won't be deleted if the key has a valid expire param that hasn't expire

### clear()

* Deletes all keys in the cache

### size()

* Returns the current number of entries in the cache

### memsize()

* Returns the number of entries taking up space in the cache
* Will usually `=== size()` unless a `setTimeout` removal went wrong

### debug(status)

* Turns on or off debugging

### hits()

* Returns the number of cache hits (only monitored in debug mode)

### misses()

* Returns the number of cache misses (only monitored in debug mode)

### keys()

* Returns all the cache keys

### exportToJSON()

* Returns a JSON string representing all the cache data
* Any timeoutCallbacks will be ignored

### importFromJSON(JSON, options)

* Merges all the data from a previous call to `export` into the cache
* Any existing entries before an `import` will remain in the cache
* Any duplicate keys will be overwritten, unless `skipDuplicates` is `true`
* Any entries that would have expired since being exported will expire upon being imported (but their callbacks will not be invoked)
* Available `options`:
  * `skipDuplicates`: If `true`, any duplicate keys will be ignored when importing them. Defaults to `false`.
* Returns the new size of the cache

### MemoryCachePro()

* MemoryCachePro constructor
* note that default import would return the default instance of MemoryCachePro
* while naming import is the actual class

## Contributing

Any help, ideas and suggestions to improve this package are very welcome 👍

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2022-present, Ivan Admaers
