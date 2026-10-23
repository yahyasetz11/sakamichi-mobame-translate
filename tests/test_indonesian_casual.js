const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// 1. SK46_TONES includes 'Indonesian Casual'
assert(src.includes("'Indonesian Casual'"), "SK46_TONES must include 'Indonesian Casual'");

// 2. toneGuides contains 'Indonesian Casual' entry
assert(src.includes("'Indonesian Casual':"), "toneGuides must have 'Indonesian Casual' key");

// 3. Style guide key rules are present
assert(src.includes('aku/kamu'), 'Style guide must require aku/kamu');
assert(src.includes('sih, dong, kan, loh, deh, nih, ya'), 'Style guide must list particles');
assert(src.includes('Jaksel'), 'Style guide must prohibit Jaksel slang');
assert(src.includes('えー、マジで！？'), 'Few-shot examples must be present');
assert(src.includes('Hah, serius!? Aku baru denger itu loh!'), 'Few-shot Indonesian translations must be present');

// 4. Behavioral check: sk46BuildStylePromptParts includes tone guidance
const promptFnMatch = src.match(/function sk46BuildStylePromptParts\(sources, opts\) \{([\s\S]*?)\n    \}/);
assert(promptFnMatch, 'sk46BuildStylePromptParts must be found');
const testFn = new Function('sources', 'opts', 'sk46State', 'SK46_TONE_DEFAULT', 'sk46CurrentChatMember', 'SK46_GROUP', 'SK46_GROUP_MEMBERS', `
    ${promptFnMatch[1]}
`);
const res = testFn(
    ['テスト'],
    null,
    { language: 'Indonesian', presetTone: 'Indonesian Casual', presetNickname: '', presetNicknameTarget: '', presetInstructions: '' },
    'Neutral',
    () => '',
    null,
    null
);
assert(res.parts.some(p => p.includes('Target: Bahasa Indonesia informal yang natural')), 'Tone guidance must be included in prompt parts');

console.log('Task 3 tests passed.');
