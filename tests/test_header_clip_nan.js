const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

const clipFnMatch = src.match(/function sk46ApplyHeaderClip\(el, rect, entry, which\) \{([\s\S]*?)\n    \}/);
assert(clipFnMatch, 'sk46ApplyHeaderClip must be found');

const clipFn = new Function('el', 'rect', 'entry', 'which', 'sk46StickyBoundary', 'sk46GetBottomLimit', 'sk46DebugSeam', `
    ${clipFnMatch[1]}
`);

// When caller passes rect without bottom (e.g. { left, top, width, height } as in bgEl):
const el = { style: {} };
const bgRect = { left: 80, top: -100, width: 300, height: 600 }; // Notice: no .bottom property!
clipFn(el, bgRect, null, 'bg', 60, () => 900, { state: () => {} });

console.log('Resulting clipPath on bgEl:', el.style.clipPath);
assert(!el.style.clipPath.includes('NaN'), 'clipPath MUST NOT contain NaN');
assert(el.style.clipPath.startsWith('inset('), 'clipPath must be a valid inset(...)');

console.log('Header clip NaN test passed.');
