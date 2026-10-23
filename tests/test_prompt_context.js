const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// Verify prompt builder contains member context rules
assert(src.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Prompt must include member name protection rule');
assert(src.includes('Self-reference rule:'), 'Prompt must include self-reference rule');
assert(src.includes('SK46_GROUP_MEMBERS[SK46_GROUP.id]'), 'Prompt must reference current group roster');

// Behavioral unit test for prompt builder logic
const promptFnMatch = src.match(/function sk46BuildStylePromptParts\(sources, opts\) \{([\s\S]*?)\n    \}/);
assert(promptFnMatch, 'sk46BuildStylePromptParts must be found');

const testFn = new Function('sources', 'opts', 'sk46State', 'SK46_TONE_DEFAULT', 'sk46CurrentChatMember', 'SK46_GROUP', 'SK46_GROUP_MEMBERS', `
    ${promptFnMatch[1]}
`);

// Test 1: with sender detected and sakura group
const resWithSender = testFn(
    ['こんにちは！'],
    null,
    { language: 'Indonesian', presetTone: 'Neutral', presetNickname: '', presetNicknameTarget: '', presetInstructions: '' },
    'Neutral',
    () => '森田 ひかる',
    { id: 'sakura', label: 'Sakurazaka46' },
    { sakura: ['森田ひかる (Morita Hikaru / Run)', '山﨑天 (Yamazaki Ten / Tenchan)'] }
);

const joinedPrompt1 = resWithSender.parts.join('\n');
assert(joinedPrompt1.includes('Current message sender: 森田 ひかる (Sakurazaka46 member)'), 'Should format sender correctly');
assert(joinedPrompt1.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Should include member name rule');
assert(joinedPrompt1.includes('Reference roster for Sakurazaka46: 森田ひかる (Morita Hikaru / Run), 山﨑天 (Yamazaki Ten / Tenchan)'), 'Should include roster');

// Test 2: without sender
const resNoSender = testFn(
    ['こんにちは！'],
    null,
    { language: 'English', presetTone: 'Neutral', presetNickname: '', presetNicknameTarget: '', presetInstructions: '' },
    'Neutral',
    () => '',
    { id: 'sakura', label: 'Sakurazaka46' },
    { sakura: ['森田ひかる (Morita Hikaru / Run)'] }
);
const joinedPrompt2 = resNoSender.parts.join('\n');
assert(!joinedPrompt2.includes('Current message sender:'), 'Should not include sender when empty');
assert(joinedPrompt2.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Should still include roster');

console.log('Task 2 tests passed.');
