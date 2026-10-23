const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// Verify prompt builder contains member context rules
assert(src.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Prompt must include member name protection rule');
assert(src.includes('Self-reference rule:'), 'Prompt must include self-reference rule');
assert(src.includes('SK46_GROUP_MEMBERS[SK46_GROUP.id]'), 'Prompt must reference current group roster');

console.log('Task 2 tests passed.');
