# Indonesian Casual Tone & Member Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add `'Indonesian Casual'` tone preset and dynamic member name context/protection to `src/sakamichi-mobame-translate.user.js`.

**Architecture:** 
1. Define `SK46_GROUP_MEMBERS` with Sakamichi rosters (Sakurazaka46, Nogizaka46, Hinatazaka46) and add `sk46CurrentChatMember()` to inspect the active chat timeline's `<h2>` header.
2. In `sk46BuildStylePromptParts`, dynamically inject current sender context, third-person self-reference translation guidance ("aku/kamu"), member name/nickname protection rules, and group roster reference.
3. Add `'Indonesian Casual'` to `SK46_TONES` and define its tailored style guide in `toneGuides` with pronouns, particles, slang restrictions, spontaneous reactions, and few-shot examples.

**Tech Stack:** JavaScript (ES2020+), Tampermonkey/Violentmonkey Userscript, Node.js (test verification).

---

### Task 1: Member Rosters and Active Chat Member Helper

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js`
- Test: `tests/test_member_context.js`

- [x] **Step 1: Write test for member roster data and sender detection**

Create `tests/test_member_context.js`:
```javascript
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/test_member_context.js`  
Expected: FAIL with assertion error (`SK46_GROUP_MEMBERS must be defined`).

- [x] **Step 3: Implement `SK46_GROUP_MEMBERS` and `sk46CurrentChatMember`**

In `src/sakamichi-mobame-translate.user.js`, define `SK46_GROUP_MEMBERS` near `SK46_GROUPS` (around line 60):
```javascript
    const SK46_GROUP_MEMBERS = Object.freeze({
        sakura: [
            // 2nd Gen
            '遠藤光莉 (Endo Hikari / Hikari)', '大園玲 (Ozono Rei / Rei, Zono)', '大沼晶保 (Onuma Akiho / Numa, Akipo)',
            '幸阪茉里乃 (Kosaka Marino / Marino)', '田村保乃 (Tamura Hono / Honosu, Hono)', '藤吉夏鈴 (Fujiyoshi Karin / Karin)',
            '松田里奈 (Matsuda Rina / Matsuda, Matsuri)', '森田ひかる (Morita Hikaru / Run, Run-chan, Hikaru)',
            '守屋麗奈 (Moriya Rena / Rena, Renana)', '山﨑天 (Yamazaki Ten / Tenchan, Ten)',
            // 3rd Gen
            '石森璃花 (Ishimori Rika / Rika)', '遠藤理子 (Endo Riko / Enriko)', '小田倉麗奈 (Odakura Reina / Reina)',
            '小島凪紗 (Kojima Nagisa / Nagi)', '谷口愛季 (Taniguchi Airi / Airi)', '中嶋優月 (Nakashima Yuzuki / Yuzu)',
            '的野美青 (Matono Mio / Mio)', '向井純葉 (Mukai Itoha / Itoha)', '村山美羽 (Murayama Miu / Miu)',
            '村井優 (Murai Yu / Yu)', '山下瞳月 (Yamashita Shizuki / Shii, Shiichan)',
            // 4th Gen
            '浅井恋乃未 (Asai Konomi / Konomi)', '稲熊ひな (Inaguma Hina / Hina)', '勝又春 (Katsumata Haru / Haru)',
            '佐藤愛桜 (Sato Neo / Neo)', '中川智尋 (Nakagawa Chihiro / Chiitan)', '松本和子 (Matsumoto Wako / Wakochi)',
            '目黒陽色 (Meguro Hiiro / Hiiro)', '山川宇衣 (Yamakawa Ui / Ui)', '山田桃実 (Yamada Momomi / Momo)',
            // Notable Grads
            '菅井友香 (Sugai Yuka)', '渡邉理佐 (Watanabe Risa)', '小林由依 (Kobayashi Yui)', '土生瑞穂 (Habu Mizuho)',
            '小池美波 (Koike Minami)', '井上梨名 (Inoue Rina / Inori)', '武元唯衣 (Takemoto Yui / Chuke)', '増本綺良 (Masumoto Kira / Kirako)'
        ],
        nogi: [
            // 3rd Gen
            '伊藤理々杏 (Ito Riria / Ririan)', '岩本蓮加 (Iwamoto Renka / Rentan)', '吉田綾乃クリスティー (Yoshida Ayano Christie / Ayatii)',
            // 4th Gen
            '遠藤さくら (Endo Sakura / Sakura, Sakuchan)', '賀喜遥香 (Kaki Haruka / Kakki)', '金川紗耶 (Kanagawa Saya / Yanchan)',
            '黒見明香 (Kuromi Haruka / Kuromin)', '柴田柚菜 (Shibata Yuna / Yunchan)', '田村真佑 (Tamura Mayu / Mayutan)',
            '筒井あやめ (Tsutsui Ayame / Ayamen)', '林瑠奈 (Hayashi Runa / Runachan)', '弓木奈於 (Yumiki Nao / Naochan)',
            // 5th Gen
            '五百城茉央 (Ioki Mao / Iochan)', '池田瑛紗 (Ikeda Teresa / Teresa)', '一ノ瀬美空 (Ichinose Miku / Kuuchan, Mikku)',
            '井上和 (Inoue Nagi / Nagi)', '岡本姫奈 (Okamoto Hina / Hiichan)', '小川彩 (Ogawa Aya / Aaya)',
            '奥田いろは (Okuda Iroha / Iroha)', '川﨑桜 (Kawasaki Sakura / Sakutan)', '菅原咲月 (Sugawara Satsuki / Satsukichan)',
            '冨里奈央 (Tomisato Nao / Naonao)', '中西アルノ (Nakanishi Aruno / Aruno)',
            // 6th Gen
            '愛宕心響 (Atago Kokone / Kokonen)', '大越ひなの (Okoshi Hinano / Hinano)', '小津玲奈 (Ozu Reina / Reina)',
            '海邉朱莉 (Kaibe Akari / Akari)', '川端晃菜 (Kawabata Hina / Hiitsun)', '鈴木佑捺 (Suzuki Yuuna / Yuuna)',
            '瀬戸口心月 (Setoguchi Mitsuki / Mitsuki)', '長嶋凛桜 (Nagashima Rio / Riotan)', '増田三莉音 (Masuda Mirine / Mirine)',
            '森平麗心 (Morihira Urumi / Urumin)', '矢田萌華 (Yada Moeka / Yadachan)',
            // Notable Grads
            '齋藤飛鳥 (Saito Asuka)', '山下美月 (Yamashita Mizuki)', '白石麻衣 (Shiraishi Mai)', '西野七瀬 (Nishino Nanase)',
            '生田絵梨花 (Ikuta Erika)', '秋元真夏 (Akimoto Manatsu)'
        ],
        hinata: [
            // 2nd Gen
            '金村美玖 (Kanemura Miku / Miku, Osushi)', '小坂菜緒 (Kosaka Nao / Nao, Kosakana)',
            // 3rd Gen
            '上村ひなの (Kamimura Hinano / Nano, Hinanon)', '髙橋未来虹 (Takahashi Mikuni / Mikuni)',
            '森本茉莉 (Morimoto Marie / Marimoto)', '山口陽世 (Yamaguchi Haruyo / Paru, Paruyo)',
            // 4th Gen
            '石塚瑶季 (Ishizuka Tamaki / Tamachan)', '小西夏菜実 (Konishi Nanami / Konishi)', '清水理央 (Shimizu Rio / Riotamu)',
            '正源司陽子 (Shogenji Yoko / Yoko, Shogenko)', '竹内希来里 (Takeuchi Kirari / Kirarin)', '平尾帆夏 (Hirao Honoka / Hiraho)',
            '平岡海月 (Hiraoka Mitsuki / Micchan)', '藤嶌果歩 (Fujishima Kaho / Kahorin)', '宮地すみれ (Miyachi Sumire / Sumire)',
            '山下葉留花 (Yamashita Haruka / Haruharu)', '渡辺莉奈 (Watanabe Rina / Rina, Rinachan)',
            // 5th Gen
            '大田美月 (Ota Mizuki / Miichan)', '大野愛実 (Ono Manami / Manamin)', '片山紗希 (Katayama Saki / Saki)',
            '蔵盛妃那乃 (Kuramori Hinano / Hinanon)', '坂井新奈 (Sakai Nina / Niitan)', '佐藤優羽 (Sato Yu / Yuuchan)',
            '下田衣珠季 (Shimoda Izuki / Izuki)', '高井俐香 (Takai Rika / Rikatan)', '鶴崎仁香 (Tsurusaki Niko / Nikochan)',
            '松尾桜 (Matsuo Sakura / Sakura)',
            // Notable Grads
            '齊藤京子 (Saito Kyoko)', '佐々木美玲 (Sasaki Mirei)', '丹生明里 (Nibu Akari)', '松田好花 (Matsuda Konoka)',
            '渡邉美穂 (Watanabe Miho)', '東村芽依 (Higashimura Mei)'
        ]
    });
```

And implement `sk46CurrentChatMember()`:
```javascript
    function sk46CurrentChatMember() {
        try {
            const host = document.querySelector(SK46_FLUTTER_HOST);
            if (!host) return '';
            const h2 = host.querySelector('h2');
            if (!h2) return '';
            const text = (h2.textContent || '').trim();
            if (text && text.length < 50) return text;
        } catch {}
        return '';
    }
```

- [x] **Step 4: Run test to verify it passes**

Run: `node tests/test_member_context.js`  
Expected: PASS with "Task 1 tests passed."

- [x] **Step 5: Verify syntax**

Run: `node --check src/sakamichi-mobame-translate.user.js`  
Expected: Clean exit (no syntax errors).

- [x] **Step 6: Commit**

```bash
git add src/sakamichi-mobame-translate.user.js tests/test_member_context.js
git commit -m "feat: add group member rosters and current chat member detection"
```

---

### Task 2: Member Context & Protection Injection in Style Prompt

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js`
- Test: `tests/test_prompt_context.js`

- [x] **Step 1: Write test for prompt injection**

Create `tests/test_prompt_context.js`:
```javascript
const assert = require('assert');
const fs = require('fs');

const src = fs.readFileSync('src/sakamichi-mobame-translate.user.js', 'utf8');

// Verify prompt builder contains member context rules
assert(src.includes('MEMBER NAMES & NICKNAMES RULE:'), 'Prompt must include member name protection rule');
assert(src.includes('Self-reference rule:'), 'Prompt must include self-reference rule');
assert(src.includes('SK46_GROUP_MEMBERS[SK46_GROUP.id]'), 'Prompt must reference current group roster');

console.log('Task 2 tests passed.');
```

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/test_prompt_context.js`  
Expected: FAIL with assertion error.

- [x] **Step 3: Integrate member context into `sk46BuildStylePromptParts`**

In `src/sakamichi-mobame-translate.user.js`, inside `sk46BuildStylePromptParts`:
```javascript
        const sender = sk46CurrentChatMember();
        if (sender) {
            parts.push(`Current message sender: ${sender} (${SK46_GROUP.label} member)`);
            parts.push(`Self-reference rule: The sender frequently refers to herself in the third person using her own name or nickname (e.g. "${sender}は..."). In ${targetLanguage}, translate such self-references using first-person pronouns ("I", "me", "aku", etc.) rather than third-person.`);
        }

        const groupRoster = SK46_GROUP_MEMBERS[SK46_GROUP.id];
        if (groupRoster && groupRoster.length > 0) {
            parts.push('');
            parts.push(`MEMBER NAMES & NICKNAMES RULE:`);
            parts.push(`- Names and nicknames of ${SK46_GROUP.label} members are personal proper nouns. NEVER translate them as literal dictionary words (e.g. 天/Ten as sky/heaven, まつり/Matsuri as festival, ひかり/Hikari as light, おすし/Osushi as sushi).`);
            parts.push(`- Keep them in recognized Romaji or standard nicknames.`);
            parts.push(`- Reference roster for ${SK46_GROUP.label}: ${groupRoster.join(', ')}.`);
        }
```

- [x] **Step 4: Run test to verify it passes**

Run: `node tests/test_prompt_context.js`  
Expected: PASS with "Task 2 tests passed."

- [x] **Step 5: Verify syntax**

Run: `node --check src/sakamichi-mobame-translate.user.js`  
Expected: Clean exit.

- [x] **Step 6: Commit**

```bash
git add src/sakamichi-mobame-translate.user.js tests/test_prompt_context.js
git commit -m "feat: inject member context and name protection into translation prompt"
```

---

### Task 3: Add 'Indonesian Casual' Tone and Detailed Style Guide

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js`
- Test: `tests/test_indonesian_casual.js`

- [x] **Step 1: Write test for 'Indonesian Casual' tone**

Create `tests/test_indonesian_casual.js`:
```javascript
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

console.log('Task 3 tests passed.');
```

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/test_indonesian_casual.js`  
Expected: FAIL with assertion error.

- [x] **Step 3: Implement 'Indonesian Casual' in `SK46_TONES` and `toneGuides`**

In `src/sakamichi-mobame-translate.user.js`:
1. Update `SK46_TONES`:
```javascript
    const SK46_TONES = ['Neutral', 'Formal', 'Casual', 'Polite', 'Indonesian Casual'];
```

2. In `sk46BuildStylePromptParts`:
Add `'Indonesian Casual'` to `toneGuides`:
```javascript
                'Indonesian Casual': [
                    'Target: Bahasa Indonesia informal yang natural — santai, hangat, dan akrab, khas pesan member idol ke fans (bukan kaku, dan bukan slang berlebihan).',
                    'Aturan gaya bahasa:',
                    '1. Pronoun: WAJIB pakai "aku/kamu". JANGAN PERNAH pakai "Anda", "saya" (kecuali pengumuman resmi), dan JANGAN pakai "gue/lo".',
                    '2. Partikel percakapan: Boleh dan dianjurkan secukupnya: sih, dong, kan, loh, deh, nih, ya.',
                    '3. DILARANG slang Jaksel atau campuran bahasa Inggris yang tidak perlu ("literally", "which is", "you know").',
                    '4. Kalimat sopan/keigo member ke fans tetap diterjemahkan informal-ramah, bukan formal kaku.',
                    '5. Reaksi spontan diterjemahkan hidup: えっ→"Eh!?", マジで→"Serius?!", うそ→"Bohong!/Masa sih?!", やばい→"Gawat/Gila sih" (sesuai konteks).',
                    '6. Angka dan satuan ditulis biasa (10 Juni, 30 besar, 15 menit).',
                    'Contoh gaya (tirukan nada ini):',
                    'JP: えー、マジで！？それ初めて聞いたんだけど！ -> ID: Hah, serius!? Aku baru denger itu loh!',
                    'JP: ちょっと待って、それはずるくない？ -> ID: Eh bentar, itu curang dong?',
                    'JP: いやいやいや、絶対違うって！ -> ID: Nggak nggak nggak, jelas bukan gitu!',
                    'JP: なんか、最近メンバーとご飯行く機会が増えて、嬉しいなって思います。 -> ID: Akhir-akhir ini makin sering makan bareng member, dan itu bikin aku seneng banget sih.',
                    'JP: それな！うちもずっとそう思ってた！ -> ID: Nah itu! Aku juga dari dulu mikir gitu!',
                    'JP: お疲れ様でした〜！ -> ID: Kerja bagus hari ini~!'
                ].join('\n')
```

- [x] **Step 4: Run test to verify it passes**

Run: `node tests/test_indonesian_casual.js`  
Expected: PASS with "Task 3 tests passed."

- [x] **Step 5: Verify syntax**

Run: `node --check src/sakamichi-mobame-translate.user.js`  
Expected: Clean exit.

- [x] **Step 6: Commit**

```bash
git add src/sakamichi-mobame-translate.user.js tests/test_indonesian_casual.js
git commit -m "feat: add Indonesian Casual tone preset and style guide"
```

---

### Task 4: End-to-End Test and Version Bump

**Files:**
- Modify: `src/sakamichi-mobame-translate.user.js`
- Test: `tests/test_e2e_prompt.js`

- [x] **Step 1: Write integration test simulating prompt generation**

Create `tests/test_e2e_prompt.js`:
Run a simulated `sk46BuildStylePromptParts` call by extracting and executing the function inside Node with mock DOM/state.
Verify:
1. When `presetTone = 'Indonesian Casual'`, the output prompt includes both the style guide and member context.
2. Line contract and placeholders remain unaffected.

- [x] **Step 2: Run all tests**

Run:
```bash
node tests/test_member_context.js
node tests/test_prompt_context.js
node tests/test_indonesian_casual.js
node tests/test_e2e_prompt.js
node --check src/sakamichi-mobame-translate.user.js
```
Expected: All tests PASS.

- [x] **Step 3: Bump version in Userscript header**

Update `@version` from `1.0.0` to `1.1.0` in `src/sakamichi-mobame-translate.user.js`.

- [x] **Step 4: Commit**

```bash
git add src/sakamichi-mobame-translate.user.js tests/
git commit -m "chore: bump version to 1.1.0 and add integration test suite"
```
