# Design Specification: Indonesian Casual Tone and Member Name Context

**Date:** 2026-10-23  
**Status:** Approved  
**Target File:** `src/sakamichi-mobame-translate.user.js`

---

## 1. Objective
Enhance the Sakamichi Mobame Translate userscript with:
1. A new preset translation tone: **`Indonesian Casual`** with natural, lively, and warm Indonesian phrasing tailored for idol-to-fan messages ("aku/kamu", conversational particles, no stiff formal phrasing, no forced Jaksel slang, few-shot examples).
2. **Member Context & Name Protection**:
   - Dynamic detection of the active message sender from the Flutter web app's UI header (`<h2>`).
   - Group-specific member rosters (Sakurazaka46, Nogizaka46, Hinatazaka46) sourced from reference data.
   - Translation prompt rules to prevent member names and nicknames from being mistranslated into literal dictionary nouns (e.g. 天 -> sky/heaven, まつり -> festival), and to properly translate third-person self-references ("ひかるは...", "るんは...") into first-person ("aku" / "I").

---

## 2. Architecture & Components

### 2.1 Preset Tone Extension
- `SK46_TONES` updated from `['Neutral', 'Formal', 'Casual', 'Polite']` to:
  ```javascript
  const SK46_TONES = ['Neutral', 'Formal', 'Casual', 'Polite', 'Indonesian Casual'];
  ```
- Because the settings sheet renders tones by iterating over `SK46_TONES`, `'Indonesian Casual'` automatically appears in the UI Tone selection view and persists in `presetTone` state.

### 2.2 Indonesian Casual Tone Style Guide
In `sk46BuildStylePromptParts`:
Add entry for `'Indonesian Casual'` in `toneGuides`:
- **Target register:** Natural informal Indonesian — relaxed and warm, not stiff, not overly slang.
- **Pronouns:** Strict "aku/kamu". Never use "Anda" or "saya" (unless official announcement context), never use "gue/lo".
- **Conversational particles:** Moderately encourage `sih, dong, kan, loh, deh, nih, ya`.
- **Slang restriction:** Avoid unnecessary Jaksel slang or unnatural English loanwords ("literally", "which is", "you know").
- **Keigo/Politeness to fans:** Translate politely spoken member words in a warm, friendly-informal tone rather than stiff formal Indonesian.
- **Spontaneous reactions:** Dynamic, natural Indonesian translations (e.g., えっ -> "Eh!?", マジで -> "Serius?!", うそ -> "Bohong!/Masa sih?!", やばい -> "Gawat/Gila sih").
- **Numbers/Dates:** Standard Indonesian representation (10 Juni, 30 besar, 15 menit).
- **Few-Shot Examples:**
  - `JP: えー、マジで！？それ初めて聞いたんだけど！` -> `ID: Hah, serius!? Aku baru denger itu loh!`
  - `JP: ちょっと待って、それはずるくない？` -> `ID: Eh bentar, itu curang dong?`
  - `JP: いやいやいや、絶対違うって！` -> `ID: Nggak nggak nggak, jelas bukan gitu!`
  - `JP: なんか、最近メンバーとご飯行く機会が増えて、嬉しいなって思います。` -> `ID: Akhir-akhir ini makin sering makan bareng member, dan itu bikin aku seneng banget sih.`
  - `JP: それな！うちもずっとそう思ってた！` -> `ID: Nah itu! Aku juga dari dulu mikir gitu!`
  - `JP: お疲れ様でした〜！` -> `ID: Kerja bagus hari ini~!`

### 2.3 Member Rosters Data (`SK46_GROUP_MEMBERS`)
A constant object mapping group ID (`sakura`, `nogi`, `hinata`) to active and notable graduated members with their Kanji, Romaji, and common nicknames:
- Sourced directly from `C:\Users\YAHYASETZ\Documents\SubtitledByAI\context\members_sakurazaka.md`, `members_nogizaka.md`, and `members_hinatazaka.md`.
- Formatted compactly as a reference text string per group.

### 2.4 Active Sender Detection (`sk46CurrentChatMember()`)
A helper function inspecting the Flutter host DOM:
- Queries `flt-semantics-host` for the `<h2>` header in the timeline view.
- Returns the trimmed text content of `<h2>` (e.g., "森田 ひかる" or "田村 保乃").
- Returns empty string `""` if not found or outside timeline.

### 2.5 Prompt Construction in `sk46BuildStylePromptParts`
Inject member context into `parts`:
1. **Active Sender Line:**
   If `sk46CurrentChatMember()` returns a name:
   - `Current message sender: ${senderName} (${SK46_GROUP.label} member)`
   - `Self-reference rule: The sender often refers to herself in the third person using her own given name or nickname. In ${targetLanguage}, translate self-references using first-person pronouns (e.g. "aku" / "I") rather than third-person.`
2. **Name & Nickname Protection Rule:**
   - `MEMBER NAMES & NICKNAMES RULE: Names and nicknames of ${SK46_GROUP.label} members are personal proper nouns. NEVER translate them into literal dictionary nouns (e.g. 天/Ten as sky/heaven, まつり/Matsuri as festival, ひかり/Hikari as light, おすし/Osushi as sushi). Keep names as proper nouns in Romaji or standard recognized nicknames.`
3. **Group Roster Reference:**
   - Include the compact member reference list for the current group (`SK46_GROUP.id`).

---

## 3. Data Flow & Integration Points
1. User selects `Preset` -> `Tone` -> `Indonesian Casual`.
2. Setting persists to GM storage under `presetTone`.
3. When messages or voice messages are translated:
   - `sk46BuildStylePromptParts(sources, opts)` is called.
   - It retrieves the current active member (`sk46CurrentChatMember()`).
   - It appends sender context, member name protection rules, and group roster for `SK46_GROUP.id`.
   - It appends the tone guidance for `Indonesian Casual` (if selected).
   - Translation request sent to the configured LLM provider.
   - Response parsed and displayed without regression to line contract or UI overlays.

---

## 4. Verification Plan
1. Check JavaScript syntax: verify valid JS without syntax errors or unescaped characters.
2. Verify `SK46_TONES` includes `'Indonesian Casual'`.
3. Verify tone selection in `presetTone` persists and properly matches `toneGuides['Indonesian Casual']`.
4. Verify `sk46CurrentChatMember()` correctly queries `<h2>` inside the Flutter semantics host without throwing exceptions when elements are missing.
5. Verify member roster and protection rules render cleanly into the prompt string without exceeding reasonable token sizes.
