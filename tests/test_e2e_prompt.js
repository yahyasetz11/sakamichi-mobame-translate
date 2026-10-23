const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// 1. Extract definitions and functions directly from source
const groupsMatch = src.match(/const SK46_GROUPS = (Object\.freeze\(\{[\s\S]*?\n    \}\));/);
assert(groupsMatch, 'SK46_GROUPS must be extracted from source');
const SK46_GROUPS = eval(groupsMatch[1]);

const membersMatch = src.match(/const SK46_GROUP_MEMBERS = (Object\.freeze\(\{[\s\S]*?\n    \}\));/);
assert(membersMatch, 'SK46_GROUP_MEMBERS must be extracted from source');
const SK46_GROUP_MEMBERS = eval(membersMatch[1]);

const hostMatch = src.match(/const SK46_FLUTTER_HOST = '([^']+)';/);
assert(hostMatch, 'SK46_FLUTTER_HOST must be extracted from source');
const SK46_FLUTTER_HOST = hostMatch[1];

const currentMemberFn = src.match(/function sk46CurrentChatMember\(\) \{[\s\S]*?\n    \}/)[0];
const encodeLineBreaksFn = src.match(/function sk46EncodeLineBreaks\(text\) \{[\s\S]*?\n    \}/)[0];
const stylePromptPartsFn = src.match(/function sk46BuildStylePromptParts\(sources, opts\) \{[\s\S]*?\n    \}/)[0];
const batchPromptFn = src.match(/function sk46BuildBatchPrompt\(sources\) \{[\s\S]*?\n    \}/)[0];

function runPromptSimulation({ hostname, sender, stateOverrides, sources, opts }) {
    const sandbox = {
        SK46_FLUTTER_HOST,
        SK46_GROUPS,
        SK46_GROUP_MEMBERS,
        SK46_GROUP: SK46_GROUPS[hostname],
        SK46_TONE_DEFAULT: 'Neutral',
        sk46State: Object.assign({
            language: 'Indonesian',
            presetTone: 'Indonesian Casual',
            presetNickname: '',
            presetNicknameTarget: '',
            presetInstructions: '',
        }, stateOverrides),
        document: {
            querySelector: (sel) => {
                if (sender && sel === `${SK46_FLUTTER_HOST} h2`) {
                    return { textContent: sender };
                }
                return null;
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext([currentMemberFn, encodeLineBreaksFn, stylePromptPartsFn, batchPromptFn].join(';\n'), sandbox);
    const styleParts = sandbox.sk46BuildStylePromptParts(sources, opts);
    const batchPrompt = sandbox.sk46BuildBatchPrompt(sources);
    return { styleParts, batchPrompt, sandbox };
}

// ==========================================
// Test 1: Indonesian Casual preset tone with active sender & roster (Sakura)
// ==========================================
{
    const sources = [
        'みなさん、こんにちは！\n森田ひかるです。',
        '今日%%%と一緒に写真撮ったよ〜！\nまた送るね！'
    ];
    const { batchPrompt } = runPromptSimulation({
        hostname: 'message.sakurazaka46.com',
        sender: '森田 ひかる',
        stateOverrides: {
            language: 'Indonesian',
            presetTone: 'Indonesian Casual'
        },
        sources
    });

    // 1. Indonesian Casual style guide presence
    assert(batchPrompt.includes('Target language: Indonesian'), 'Must state target language Indonesian');
    assert(batchPrompt.includes('Tone preference: Indonesian Casual'), 'Must state Indonesian Casual tone');
    assert(batchPrompt.includes('Target: Bahasa Indonesia informal yang natural'), 'Must include Indonesian Casual guidance');
    assert(batchPrompt.includes('WAJIB pakai "aku/kamu"'), 'Must enforce aku/kamu');
    assert(batchPrompt.includes('sih, dong, kan, loh, deh, nih, ya'), 'Must list conversational particles');
    assert(batchPrompt.includes('DILARANG slang Jaksel'), 'Must forbid Jaksel slang');
    assert(batchPrompt.includes('Hah, serius!? Aku baru denger itu loh!'), 'Must include few-shot examples');

    // 2. Member context presence
    assert(batchPrompt.includes('Current message sender: 森田 ひかる (Sakurazaka46 member)'), 'Must include active sender');
    assert(batchPrompt.includes('Self-reference rule: The sender frequently refers to herself in the third person'), 'Must include self-reference rule');
    assert(batchPrompt.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Must include member names rule');
    assert(batchPrompt.includes('Reference roster for Sakurazaka46:'), 'Must include Sakura roster header');
    assert(batchPrompt.includes('森田ひかる (Morita Hikaru / Run, Run-chan, Hikaru)'), 'Must contain Morita in roster');
    assert(batchPrompt.includes('山﨑天 (Yamazaki Ten / Tenchan, Ten)'), 'Must contain Ten in roster');

    // 3. Line contract and placeholder rules
    assert(batchPrompt.includes('preserve the TOTAL number of lines, but you MAY move a <NL> to a different word boundary'), 'Line contract must be preserved');
    assert(batchPrompt.includes('The source contains the literal token "%%%" — a runtime placeholder for the fan\'s nickname. Output it exactly as "%%%"'), 'Placeholder rule must be intact');
    assert(batchPrompt.includes('[1] みなさん、こんにちは！ <NL> 森田ひかるです。'), 'Lines should be break-encoded');
    assert(batchPrompt.includes('[2] 今日%%%と一緒に写真撮ったよ〜！ <NL> また送るね！'), 'Lines should include placeholder and break-encoding');
}

// ==========================================
// Test 2: Nogizaka46 roster and sender
// ==========================================
{
    const sources = ['こんにちは！\n今日もお疲れ様〜'];
    const { batchPrompt } = runPromptSimulation({
        hostname: 'message.nogizaka46.com',
        sender: '遠藤 さくら',
        stateOverrides: {
            language: 'Indonesian',
            presetTone: 'Indonesian Casual'
        },
        sources
    });

    assert(batchPrompt.includes('Current message sender: 遠藤 さくら (Nogizaka46 member)'), 'Must include Nogi sender');
    assert(batchPrompt.includes('Reference roster for Nogizaka46:'), 'Must include Nogi roster header');
    assert(batchPrompt.includes('遠藤さくら (Endo Sakura / Sakura, Sakuchan)'), 'Must contain Endo Sakura');
    assert(batchPrompt.includes('井上和 (Inoue Nagi / Nagi)'), 'Must contain Inoue Nagi');
    assert(!batchPrompt.includes('Sakurazaka46'), 'Must not mention Sakurazaka46 for Nogi app');
}

// ==========================================
// Test 3: Hinatazaka46 roster and sender
// ==========================================
{
    const sources = ['ひなたのみんな〜\n元気ですか？'];
    const { batchPrompt } = runPromptSimulation({
        hostname: 'message.hinatazaka46.com',
        sender: '金村 美玖',
        stateOverrides: {
            language: 'Indonesian',
            presetTone: 'Indonesian Casual'
        },
        sources
    });

    assert(batchPrompt.includes('Current message sender: 金村 美玖 (Hinatazaka46 member)'), 'Must include Hinata sender');
    assert(batchPrompt.includes('Reference roster for Hinatazaka46:'), 'Must include Hinata roster header');
    assert(batchPrompt.includes('金村美玖 (Kanemura Miku / Miku, Osushi)'), 'Must contain Kanemura Miku');
    assert(batchPrompt.includes('小坂菜緒 (Kosaka Nao / Nao, Kosakana)'), 'Must contain Kosaka Nao');
    assert(!batchPrompt.includes('Sakurazaka46'), 'Must not mention Sakurazaka46 for Hinata app');
}

// ==========================================
// Test 4: Non-Indonesian Casual tone presets (Neutral & Casual)
// ==========================================
{
    // Test Neutral tone with English
    const { batchPrompt: neutralPrompt } = runPromptSimulation({
        hostname: 'message.sakurazaka46.com',
        sender: '藤吉 夏鈴',
        stateOverrides: {
            language: 'English',
            presetTone: 'Neutral'
        },
        sources: ['こんにちは！']
    });

    assert(neutralPrompt.includes('Tone preference: Neutral'), 'Must state Neutral tone');
    assert(neutralPrompt.includes('balanced, neutral register'), 'Must have neutral tone guidance');
    assert(!neutralPrompt.includes('Bahasa Indonesia'), 'Must not include Indonesian guidance for Neutral/English');
    assert(!neutralPrompt.includes('aku/kamu'), 'Must not include aku/kamu for Neutral/English');
    assert(neutralPrompt.includes('Current message sender: 藤吉 夏鈴 (Sakurazaka46 member)'), 'Must still have sender');
    assert(neutralPrompt.includes('Reference roster for Sakurazaka46:'), 'Must still have member roster');

    // Test Casual tone
    const { batchPrompt: casualPrompt } = runPromptSimulation({
        hostname: 'message.sakurazaka46.com',
        sender: '藤吉 夏鈴',
        stateOverrides: {
            language: 'English',
            presetTone: 'Casual'
        },
        sources: ['こんにちは！']
    });

    assert(casualPrompt.includes('Tone preference: Casual'), 'Must state Casual tone');
    assert(casualPrompt.includes('casual, friendly, everyday language'), 'Must have casual tone guidance');
    assert(!casualPrompt.includes('Bahasa Indonesia'), 'Must not include Indonesian guidance for Casual/English');
}

// ==========================================
// Test 5: Fallback when sender is absent / not in chat
// ==========================================
{
    const { batchPrompt } = runPromptSimulation({
        hostname: 'message.sakurazaka46.com',
        sender: '',
        stateOverrides: {
            language: 'Indonesian',
            presetTone: 'Indonesian Casual'
        },
        sources: ['こんにちは！']
    });

    assert(!batchPrompt.includes('Current message sender:'), 'Should omit sender when not available');
    assert(!batchPrompt.includes('Self-reference rule:'), 'Should omit self-reference rule when sender not available');
    assert(batchPrompt.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Should still include roster protection');
}

// ==========================================
// Test 6: Custom Nickname Target & Instructions
// ==========================================
{
    const { batchPrompt } = runPromptSimulation({
        hostname: 'message.sakurazaka46.com',
        sender: '森田 ひかる',
        stateOverrides: {
            language: 'Indonesian',
            presetTone: 'Indonesian Casual',
            presetNickname: 'たろう',
            presetNicknameTarget: 'Taro',
            presetInstructions: 'Jangan gunakan kata gaul.'
        },
        sources: ['たろう%%%、おはよう！']
    });

    assert(batchPrompt.includes('render every occurrence of "たろう" as "Taro"'), 'Should handle nickname target');
    assert(batchPrompt.includes('Treat it as an occurrence of the nickname and output "Taro"'), 'Should handle placeholder replacement with target');
    assert(batchPrompt.includes('Jangan gunakan kata gaul.'), 'Should include user instructions');
}

console.log('Task 4 e2e prompt integration tests passed.');
