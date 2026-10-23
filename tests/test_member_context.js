const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// 1. Verify SK46_GROUP_MEMBERS definition exists and has sakura, nogi, hinata
assert(src.includes('const SK46_GROUP_MEMBERS ='), 'SK46_GROUP_MEMBERS must be defined');
assert(src.includes('sakura:'), 'SK46_GROUP_MEMBERS must include sakura');
assert(src.includes('nogi:'), 'SK46_GROUP_MEMBERS must include nogi');
assert(src.includes('hinata:'), 'SK46_GROUP_MEMBERS must include hinata');

// Check sample members
assert(src.includes('森田ひかる') || src.includes('森田 ひかる'), 'Sakura roster must include Morita Hikaru');
assert(src.includes('遠藤さくら') || src.includes('遠藤 さくら'), 'Nogi roster must include Endo Sakura');
assert(src.includes('金村美玖') || src.includes('金村 美玖'), 'Hinata roster must include Kanemura Miku');

// 2. Verify sk46CurrentChatMember function exists
assert(src.includes('function sk46CurrentChatMember('), 'sk46CurrentChatMember must be defined');

console.log('Task 1 tests passed.');
