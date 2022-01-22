/* eslint-disable no-unused-vars */
const cache = require('./index.js');

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
    console.log('Your socks 🧦🧦 are under the couch!');
  }
);

/* Example 4 */

const { MemoryCachePro } = require('./index.js');

const myDogCache = new MemoryCachePro();
const myCatCache = new MemoryCachePro();

myDogCache.put('rule', 'StopEatMySlippers!');
myCatCache.put('rule', 'DoNotOpenMyRefrigerator!');

myDogCache.get('rule'); // StopEatMySlippers
myCatCache.get('rule'); // DoNotOpenMyRefrigerator
