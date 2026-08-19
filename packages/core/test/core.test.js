const assert = require('assert');
const { extractCodeFromSearch } = require('../src/index');

assert.strictEqual(extractCodeFromSearch('?ref=AB12CD34'), 'AB12CD34');
assert.strictEqual(
  extractCodeFromSearch('utm_content=ZZ99YY88&x=1'),
  'ZZ99YY88'
);
assert.strictEqual(extractCodeFromSearch(''), null);
console.log('ok @circuul/core');
