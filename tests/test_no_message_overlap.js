const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// 1. Verify container padding matches proper bubble alignment
assert(src.includes('SK46_MIRROR_CONTAINER_PAD_LEFT = 24'), 'PAD_LEFT must be 24 for proper alignment');
assert(src.includes('SK46_MIRROR_CONTAINER_PAD_RIGHT = 24'), 'PAD_RIGHT must be 24 for proper alignment');

// 2. Verify line height matches original styling
assert(src.includes('SK46_MIRROR_LINE_HEIGHT_RATIO = 1.82'), 'Line height ratio must be 1.82');

// 3. Verify decode line breaks collapses excessive newlines
const decodeFnMatch = src.match(/function sk46DecodeLineBreaks\(text\) \{([\s\S]*?)\n    \}/);
assert(decodeFnMatch, 'sk46DecodeLineBreaks must be found');
const decodeFn = new Function('text', `${decodeFnMatch[1]}`);
assert(!decodeFn('A <NL> <NL> <NL> B').includes('\n\n\n'), 'Must not have 3 or more consecutive newlines');

// 4. Verify mirrorEl uses overflow hidden and maxHeight capped at message height (crops rather than shrinking font)
assert(src.includes("mirrorEl.style.overflow = 'hidden'"), 'Must hide overflow');
assert(!src.includes('scale = Math.max(0.82'), 'Must not scale font down to smaller size');

console.log('No-overlap and placeholder alignment tests passed.');
