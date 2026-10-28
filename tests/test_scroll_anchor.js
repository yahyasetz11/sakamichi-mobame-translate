const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// 1. Verify sk46DecideAnchorMode includes top boundary check for mode switching
assert(src.includes('if (sk46IsAtTopBoundaryStrict(rect)) return \'bottom\';'), 'Must return bottom when at top boundary');

// 2. Verify origTextTopFromBottom is calculated even in center mode
const rebuildMatch = src.match(/origTextTopFromBottom = (.*?);/);
assert(rebuildMatch, 'origTextTopFromBottom must be assigned');
assert(!src.includes('if (anchorMode === \'bottom\') {\n                        origTextTopFromBottom'), 'origTextTopFromBottom must not be guarded by anchorMode === bottom');

// 3. Test behavior of sk46DecideAnchorMode
const decideFnMatch = src.match(/function sk46DecideAnchorMode\(rect, naturalHeight\) \{([\s\S]*?)\n    \}/);
assert(decideFnMatch, 'sk46DecideAnchorMode must be found');

const stickyBoundary = 60;
const isAtTopStrict = (r) => r.top <= stickyBoundary + 2;

const decideFn = new Function('rect', 'naturalHeight', 'sk46IsAtTopBoundaryStrict', `
    ${decideFnMatch[1]}
`);

// Test: below header (top = 100) -> 'center'
assert.strictEqual(decideFn({ top: 100, height: 400 }, 400, isAtTopStrict), 'center');

// Test: at/above header (top = 50 <= 62) -> 'bottom'
assert.strictEqual(decideFn({ top: 50, height: 400 }, 400, isAtTopStrict), 'bottom');

console.log('Scroll anchor mode tests passed.');
