const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

const parseMatch = src.match(/function sk46ParseBatchResponse\(raw, n\) \{([\s\S]*?)\n    \}/);
assert(parseMatch, 'sk46ParseBatchResponse must be found');

const decodeFnMatch = src.match(/function sk46DecodeLineBreaks\(text\) \{([\s\S]*?)\n    \}/);
const decodeFn = new Function('text', `${decodeFnMatch[1]}`);

const parseFn = new Function('raw', 'n', 'sk46DecodeLineBreaks', `
    ${parseMatch[1]}
`);

// Test: LLM splits a long message across multiple physical lines
const rawLLMResponse = `
[1] Bagian pertama dari pesan panjang <NL> Bagian kedua dari pesan
Bagian ketiga yang ada di baris baru <NL> Bagian keempat dari pesan
`;

const parsed = parseFn(rawLLMResponse, 1, decodeFn);
console.log('Parsed result:', parsed);

// The parsed result MUST contain all parts!
assert(parsed[0].includes('Bagian pertama'), 'Must contain part 1');
assert(parsed[0].includes('Bagian kedua'), 'Must contain part 2');
assert(parsed[0].includes('Bagian ketiga'), 'Must contain part 3 (was dropped by if (!m) continue)');
assert(parsed[0].includes('Bagian keempat'), 'Must contain part 4 (was dropped by if (!m) continue)');

console.log('Multi-line batch parse test passed.');
