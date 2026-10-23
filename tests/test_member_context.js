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

// 3. Behavioral checks
const match = src.match(/const SK46_GROUP_MEMBERS = (Object\.freeze\(\{[\s\S]*?\n    \}\));/);
assert(match, 'SK46_GROUP_MEMBERS block must match pattern');
const members = eval(match[1]);
assert(Array.isArray(members.sakura) && members.sakura.length >= 30, 'Sakura roster should have 30+ members');
assert(Array.isArray(members.nogi) && members.nogi.length >= 30, 'Nogi roster should have 30+ members');
assert(Array.isArray(members.hinata) && members.hinata.length >= 25, 'Hinata roster should have 25+ members');

// Test sk46CurrentChatMember without DOM
const fnMatch = src.match(/function sk46CurrentChatMember\(\) \{[\s\S]*?\n    \}/);
assert(fnMatch, 'sk46CurrentChatMember implementation match');
const currentMemberFn = eval('(' + fnMatch[0] + ')');
assert.strictEqual(currentMemberFn(), '', 'Should return empty string when document is not defined');

// Test sk46CurrentChatMember with mock DOM
global.SK46_FLUTTER_HOST = 'flt-semantics-host';
global.document = {
    querySelector: (sel) => {
        if (sel === 'flt-semantics-host h2') return { textContent: '  森田 ひかる  ' };
        return null;
    }
};
assert.strictEqual(currentMemberFn(), '森田 ひかる', 'Should trim member name properly');

// Test length guard (> 50 chars)
global.document = {
    querySelector: (sel) => {
        if (sel === 'flt-semantics-host h2') return { textContent: 'A'.repeat(51) };
        return null;
    }
};
assert.strictEqual(currentMemberFn(), '', 'Should return empty string if text is too long');
delete global.document;
delete global.SK46_FLUTTER_HOST;

console.log('Task 1 tests passed.');
