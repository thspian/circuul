const assert = require('assert');
const {
  extractCodeFromSearch,
  shouldPersistMatched,
} = require('../src/index');

assert.strictEqual(extractCodeFromSearch('?ref=AB12CD34'), 'AB12CD34');
assert.strictEqual(
  extractCodeFromSearch('utm_content=ZZ99YY88&x=1'),
  'ZZ99YY88'
);
assert.strictEqual(extractCodeFromSearch('?circuul_ref=CODE99'), 'CODE99');
assert.strictEqual(extractCodeFromSearch(''), null);

assert.strictEqual(shouldPersistMatched({ attributed: true }), true);
assert.strictEqual(
  shouldPersistMatched({ attributed: false, reason: 'unmatched' }),
  true
);
assert.strictEqual(
  shouldPersistMatched({ attributed: false, reason: 'network_error' }),
  false
);
assert.strictEqual(
  shouldPersistMatched({ attributed: false, reason: 'error' }),
  false
);

console.log('ok @thspian/circuul-core');
