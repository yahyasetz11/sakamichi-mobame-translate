const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// Extract sk46IsAtBottomBoundary function
const bottomBoundaryFnMatch = src.match(/function sk46IsAtBottomBoundary\(rect\) \{([\s\S]*?)\n    \}/);
assert(bottomBoundaryFnMatch, 'sk46IsAtBottomBoundary must be found');

const bottomLimit = 900;
const tolerance = 2;

const isAtBottomFn = new Function('rect', 'sk46GetBottomLimit', 'SK46_BOTTOM_BOUNDARY_TOLERANCE_PX', `
    ${bottomBoundaryFnMatch[1]}
`);

// Test 1: Message fits screen (top: 100, bottom: 400)
assert.strictEqual(
    isAtBottomFn({ top: 100, bottom: 400 }, () => bottomLimit, tolerance),
    false,
    'Message fitting screen must not be at bottom boundary'
);

// Test 2: Long message extending past bottom of screen (top: 100, bottom: 1500)
// This is the bug reported by user: long messages must NOT be flagged as at-bottom-boundary (which hides them)
assert.strictEqual(
    isAtBottomFn({ top: 100, bottom: 1500 }, () => bottomLimit, tolerance),
    false,
    'Long message extending past screen must NOT be treated as offscreen at bottom boundary'
);

// Test 3: Message completely below the viewport (top: 950, bottom: 1200)
assert.strictEqual(
    isAtBottomFn({ top: 950, bottom: 1200 }, () => bottomLimit, tolerance),
    true,
    'Message completely below the screen should be treated as at bottom boundary'
);

// Test 4: Verify clipPath handles bottom overflow
const clipFnMatch = src.match(/function sk46ApplyHeaderClip\(el, rect, entry, which\) \{([\s\S]*?)\n    \}/);
assert(clipFnMatch, 'sk46ApplyHeaderClip must be found');

const clipFn = new Function('el', 'rect', 'entry', 'which', 'sk46StickyBoundary', 'sk46GetBottomLimit', 'sk46DebugSeam', `
    ${clipFnMatch[1]}
`);

// 4a: Long message extending below bottomLimit (top: 100, bottom: 1200, height: 1100, bottomLimit: 900)
const elBottomOverflow = { style: {} };
clipFn(elBottomOverflow, { top: 100, bottom: 1200, height: 1100 }, null, 'mirror', 50, () => 900, { state: () => {} });
assert.strictEqual(
    elBottomOverflow.style.clipPath,
    'inset(0px 0 300px 0)',
    'Clip path should clip 300px off the bottom for message extending past 900px'
);

console.log('Bottom boundary tests passed.');
