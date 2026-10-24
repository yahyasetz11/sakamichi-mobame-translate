// ==UserScript==
// @name           Sakamichi Mobame Translate (iOS)
// @namespace      https://github.com/zeem12/sakamichi-mobame-translate
// @version        1.1.0-ios
// @description    Per-bubble translation overlay and voice message transcription for Sakurazaka46, Nogizaka46, and Hinatazaka46 Message on iOS Safari.
// @author         Zeem12
// @match          https://message.sakurazaka46.com/*
// @match          https://message.nogizaka46.com/*
// @match          https://message.hinatazaka46.com/*
// @noframes
// @grant          unsafeWindow
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// @grant          GM_info
// @connect        generativelanguage.googleapis.com
// @connect        api.groq.com
// @connect        api.cerebras.ai
// @connect        openrouter.ai
// @connect        api.deepseek.com
// @connect        api.openai.com
// @connect        api.anthropic.com
// @connect        dmu54xlwnhgck.cloudfront.net
// @connect        djznowbmqickg.cloudfront.net
// @connect        d3ux740zhdvrpf.cloudfront.net
// @run-at         document-start
// @license        MIT
// @homepageURL    https://github.com/zeem12/sakamichi-mobame-translate
// @supportURL     https://github.com/zeem12/sakamichi-mobame-translate/issues
// @updateURL      https://github.com/zeem12/sakamichi-mobame-translate/releases/latest/download/sakamichi-mobame-translate-ios.user.js
// @downloadURL    https://github.com/zeem12/sakamichi-mobame-translate/releases/latest/download/sakamichi-mobame-translate-ios.user.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;

    const pageWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    try {
        pageWin.flutterConfiguration = pageWin.flutterConfiguration || {};
        pageWin.flutterConfiguration.enableSemantics = true;
    } catch (e) {}

    const SK46_GROUPS = Object.freeze({
        'message.sakurazaka46.com': Object.freeze({
            id: 'sakura',
            label: 'Sakurazaka46',
            origin: 'https://message.sakurazaka46.com',
            accent: '#E395B0',
        }),
        'message.nogizaka46.com': Object.freeze({
            id: 'nogi',
            label: 'Nogizaka46',
            origin: 'https://message.nogizaka46.com',
            accent: '#8F34B4',
        }),
        'message.hinatazaka46.com': Object.freeze({
            id: 'hinata',
            label: 'Hinatazaka46',
            origin: 'https://message.hinatazaka46.com',
            accent: '#75BCE1',
        }),
    });
    const SK46_GROUP_MEMBERS = Object.freeze({
        sakura: [
            // 1st Gen
            '小池美波 (Koike Minami)',
            // 2nd Gen
            '井上梨名 (Inoue Rina / Inori)', '遠藤光莉 (Endo Hikari / Hikari)', '大園玲 (Ozono Rei / Rei, Zono)',
            '大沼晶保 (Onuma Akiho / Numa, Akipo)', '幸阪茉里乃 (Kosaka Marino / Marino)', '武元唯衣 (Takemoto Yui / Chuke)',
            '田村保乃 (Tamura Hono / Honosu, Hono)', '藤吉夏鈴 (Fujiyoshi Karin / Karin)', '増本綺良 (Masumoto Kira / Kirako)',
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
            '菅井友香 (Sugai Yuka)', '渡邉理佐 (Watanabe Risa)', '小林由依 (Kobayashi Yui)', '土生瑞穂 (Habu Mizuho)'
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
    const SK46_GROUP = SK46_GROUPS[location.hostname];
    if (!SK46_GROUP) return;

    const sk46State = {
        debugWireframe: false,
        debugContainers: false,
        debugMirrorText: false,
        debugMirrorBg: false,
        collapsed: false,
        preview: true,
        textTopPadPx: 14,
        pictureCaptionBiasPx: -8,
        mirrorRightPadExtraPx: 5,
        mirrorBgBleedTopPx: 10,
        mirrorBgBleedRightPx: 30,
        mirrorBgBleedBottomPx: 10,
        mirrorBgBleedLeftPx: 24.5,
        skipUnreadButtons: true,
        maskFloatingButtons: true,
        showTranslateBtn: true,
        translateEnabled: false,
        language: 'English',
        provider: 'gemini',
        apiKeys: {},
        
        models: {},
        model: null,
        presetNickname: '',
        presetNicknameTarget: '',
presetTone: 'Neutral',
        presetInstructions: '',
        sheetOpen: false,
        sheetView: 'main',
        autoTranscribe: true,
        audioUseChatProvider: true,
        audioProvider: 'gemini',
        audioModels: {},
        audioModel: null,
    };

    const SK46_PERSIST_KEYS = [
        'preview', 'textTopPadPx', 'pictureCaptionBiasPx',
        'mirrorRightPadExtraPx',
        'mirrorBgBleedTopPx', 'mirrorBgBleedRightPx',
        'mirrorBgBleedBottomPx', 'mirrorBgBleedLeftPx',
        'skipUnreadButtons', 'maskFloatingButtons',
        'showTranslateBtn', 'translateEnabled',
        'language', 'provider', 'apiKeys', 'model', 'models',
        'presetNicknameTarget',
        'presetTone', 'presetInstructions',
'autoTranscribe', 'audioUseChatProvider', 'audioProvider', 'audioModel', 'audioModels',
    ];
    const SK46_PERSIST_PREFIX = 'sk46.v1.';

    function sk46GroupKey(suffix) {
        return `sk46.v2.${SK46_GROUP.id}.${suffix}`;
    }

    function sk46GmGet(key, def) {
        try { if (typeof GM_getValue === 'function') return GM_getValue(key, def); }
        catch (e) {}
        return def;
    }
    function sk46GmSet(key, val) {
        try { if (typeof GM_setValue === 'function') GM_setValue(key, val); }
        catch (e) {}
    }

    function sk46LoadPersistedState() {
        let loaded = 0;
        for (const key of SK46_PERSIST_KEYS) {
            if (!(key in sk46State)) continue;
            const v = sk46GmGet(SK46_PERSIST_PREFIX + key, undefined);
            if (v !== undefined) {
                if (key === 'apiKeys') {
                    if (v && typeof v === 'object' && !Array.isArray(v)) {
                        sk46State.apiKeys = v;
                        loaded++;
                    }
                    continue;
                }
                
                if (key === 'models' || key === 'audioModels') {
                    if (v && typeof v === 'object' && !Array.isArray(v)) {
                        sk46State[key] = v;
                        loaded++;
                    }
                    continue;
                }
                sk46State[key] = v;
                loaded++;
            }
        }
        const oldSingle = sk46GmGet(SK46_PERSIST_PREFIX + 'apiKey', undefined);
        if (typeof oldSingle === 'string' && oldSingle && !sk46State.apiKeys[sk46State.provider]) {
            sk46State.apiKeys[sk46State.provider] = oldSingle;
        }
        const oldBleed = sk46GmGet(SK46_PERSIST_PREFIX + 'mirrorBgBleedPx', undefined);
        if (typeof oldBleed === 'number' && Number.isFinite(oldBleed)) {
            const bleedKeys = ['mirrorBgBleedTopPx', 'mirrorBgBleedRightPx', 'mirrorBgBleedBottomPx', 'mirrorBgBleedLeftPx'];
            for (const k of bleedKeys) {
                const current = sk46GmGet(SK46_PERSIST_PREFIX + k, undefined);
                if (current === undefined) sk46State[k] = oldBleed;
            }
        }
        if (!sk46State.apiKeys || typeof sk46State.apiKeys !== 'object') sk46State.apiKeys = {};

        if (!sk46State.models || typeof sk46State.models !== 'object') sk46State.models = {};
        if (!sk46State.audioModels || typeof sk46State.audioModels !== 'object') sk46State.audioModels = {};
        if (sk46State.model && !sk46State.models[sk46State.provider]) {
            sk46State.models[sk46State.provider] = sk46State.model;
        }
        if (sk46State.audioModel && !sk46State.audioModels[sk46State.audioProvider]) {
            sk46State.audioModels[sk46State.audioProvider] = sk46State.audioModel;
        }
        
        sk46State.model = sk46State.models[sk46State.provider] || null;
        sk46State.audioModel = sk46State.audioModels[sk46State.audioProvider] || null;

        if (sk46State.presetTone && !SK46_TONES.includes(sk46State.presetTone)) {
            sk46State.presetTone = SK46_TONE_DEFAULT;
            sk46GmSet(SK46_PERSIST_PREFIX + 'presetTone', SK46_TONE_DEFAULT);
        } else if (!sk46State.presetTone) {
            sk46State.presetTone = SK46_TONE_DEFAULT;
        }

        return loaded;
    }

    function sk46PersistKey(key) {
        if (!SK46_PERSIST_KEYS.includes(key)) return;
        sk46GmSet(SK46_PERSIST_PREFIX + key, sk46State[key]);
    }

    const sk46PersistTimers = new Map();
    function sk46PersistKeyDebounced(key, delayMs = 400) {
        if (!SK46_PERSIST_KEYS.includes(key)) return;
        const existing = sk46PersistTimers.get(key);
        if (existing) clearTimeout(existing);
        const t = setTimeout(() => {
            sk46PersistTimers.delete(key);
            sk46PersistKey(key);
        }, delayMs);
        sk46PersistTimers.set(key, t);
    }

    function sk46SetState(key, val) {
        if (sk46State[key] === val) return;
        sk46State[key] = val;
        sk46PersistKey(key);
    }

    function sk46ReadProfileNickname() {
        try {
            const raw = window.localStorage.getItem('flutter.PROFILE_NAME_KEY');
            if (raw == null) return '';
            let v = raw;
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'string') v = parsed;
            } catch {  }
            v = String(v).trim();
            v = v.replace(/^"+|"+$/g, '').trim();
            return v;
        } catch (e) { return ''; }
    }

    function sk46SyncProfileNickname() {
        const nick = sk46ReadProfileNickname();
        if (nick !== sk46State.presetNickname) {
            const prev = sk46State.presetNickname;
            sk46State.presetNickname = nick;
            if (sk46TranslationLogEnabled) {
                ;
            }
        }
    }

    const SK46_SUPPORTED_LANGUAGES = [
        'Arabic', 'Bengali', 'Bulgarian',
        'Chinese (Simplified)', 'Chinese (Traditional)',
        'Croatian', 'Czech', 'Danish', 'Dutch',
        'English', 'Estonian', 'Finnish', 'French', 'German', 'Greek',
        'Gujarati', 'Hebrew', 'Hindi', 'Hungarian',
        'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Korean',
        'Latvian', 'Lithuanian', 'Malayalam', 'Marathi', 'Norwegian',
        'Persian', 'Polish', 'Portuguese', 'Romanian', 'Russian',
        'Serbian', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish',
        'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese',
    ];

    const SK46_RTL_LANGUAGES = new Set(['Arabic', 'Hebrew', 'Persian', 'Urdu']);

    function sk46TargetLanguageIsRtl() {
        return SK46_RTL_LANGUAGES.has(String(sk46State.language || ''));
    }

    function sk46ApplyTextDirection(el, rtl) {
        if (!el) return;
        if (rtl) el.setAttribute('dir', 'rtl');
        else el.removeAttribute('dir');
    }

    const SK46_PROVIDERS = [
        { id: 'gemini', label: 'Gemini (Google)', keyUrl: 'https://aistudio.google.com/app/apikey', keyPlaceholder: 'AIzaSy…' },
        { id: 'groq', label: 'Groq', keyUrl: 'https://console.groq.com/keys', keyPlaceholder: 'gsk_…', endpoint: 'https://api.groq.com/openai/v1/chat/completions' },
        { id: 'cerebras', label: 'Cerebras', keyUrl: 'https://cloud.cerebras.ai/', keyPlaceholder: 'csk-…', endpoint: 'https://api.cerebras.ai/v1/chat/completions' },
        { id: 'openrouter', label: 'OpenRouter', keyUrl: 'https://openrouter.ai/keys', keyPlaceholder: 'sk-or-v1-…', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
        { id: 'deepseek', label: 'DeepSeek', keyUrl: 'https://platform.deepseek.com/api_keys', keyPlaceholder: 'sk-…', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
        { id: 'openai', label: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys', keyPlaceholder: 'sk-…', endpoint: 'https://api.openai.com/v1/chat/completions' },
        { id: 'anthropic', label: 'Anthropic (Claude)', keyUrl: 'https://console.anthropic.com/settings/keys', keyPlaceholder: 'sk-ant-…' },
    ];

    const SK46_TONES = ['Neutral', 'Formal', 'Casual', 'Polite', 'Indonesian Casual'];
    const SK46_TONE_DEFAULT = 'Neutral';

    const sk46DebugSeam = {
        isEnabled: () => false,
        bumpRebuild: () => {},
        clearState: () => {},
        nextId: () => 0,
        dropState: () => {},
        state: () => {},
    };

    let sk46DebugBox = () => null;
    let sk46SyncDebugBox = () => {};

    const SK46_STT_PROVIDERS = ['gemini', 'groq', 'openai'];

    const SK46_STT_MODELS = {
        gemini: [
            { id: 'gemini-3.5-transcribe', note: '' },
            { id: 'gemini-3.5-flash', note: 'No word timing' },
            { id: 'gemini-2.5-flash', note: 'No word timing' },
        ],
        groq: [
            { id: 'whisper-large-v3', note: '' },
            { id: 'whisper-large-v3-turbo', note: 'Faster, less accurate' },
        ],
        openai: [
            { id: 'gpt-4o-transcribe', note: '' },
            { id: 'gpt-4o-mini-transcribe', note: 'Cheaper, less accurate' },
        ],
    };
    const SK46_STT_DEFAULT_MODELS = {
        gemini: SK46_STT_MODELS.gemini[0].id,
        groq: SK46_STT_MODELS.groq[0].id,
        openai: SK46_STT_MODELS.openai[0].id,
    };

    function sk46IsDedicatedSttModel(model) {
        return /transcribe/i.test(String(model || ''));
    }

    function sk46SttModelNote(providerId, modelId) {
        const hit = (SK46_STT_MODELS[providerId] || []).find(m => m.id === modelId);
        if (hit) return hit.note || '';
        if (providerId === 'gemini' && modelId && !sk46IsDedicatedSttModel(modelId)) {
            return 'No word timing';
        }
        return '';
    }

    const SK46_AUDIO_TRANSCRIBE_PROMPT = [
        'Transcribe the attached voice message verbatim.',
        '',
        '- Output ONLY the words that are spoken, nothing else.',
        '- No speaker labels, no timestamps, no translation, no commentary.',
        '- No preamble, no quotes, no code fence.',
        '- Keep emoji, kaomoji and interjections exactly as spoken.',
        '- If the audio contains no speech, output nothing.',
    ].join('\n');
    function sk46SupportsStt(providerId) {
        return SK46_STT_PROVIDERS.includes(providerId);
    }
    function sk46EffectiveAudioProvider() {
        return sk46State.audioUseChatProvider ? sk46State.provider : sk46State.audioProvider;
    }
    function sk46EffectiveAudioApiKey() {
        const p = sk46EffectiveAudioProvider();
        return String((sk46State.apiKeys && sk46State.apiKeys[p]) || '').trim();
    }

    function sk46SetChatModel(providerId, model) {
        const id = String(providerId || '');
        if (!id) return;
        if (!sk46State.models || typeof sk46State.models !== 'object') sk46State.models = {};
        if (model) sk46State.models[id] = model;
        else delete sk46State.models[id];
        if (sk46State.provider === id) sk46State.model = model || null;
        sk46PersistKeyDebounced('models', 300);
        sk46PersistKeyDebounced('model', 300);
    }

    function sk46SetAudioModel(providerId, model) {
        const id = String(providerId || '');
        if (!id) return;
        if (!sk46State.audioModels || typeof sk46State.audioModels !== 'object') sk46State.audioModels = {};
        if (model) sk46State.audioModels[id] = model;
        else delete sk46State.audioModels[id];
        if (sk46EffectiveAudioProvider() === id) sk46State.audioModel = model || null;
        sk46PersistKeyDebounced('audioModels', 300);
        sk46PersistKeyDebounced('audioModel', 300);
    }

    function sk46RestoreChatModel(providerId) {
        const saved = (sk46State.models && sk46State.models[providerId]) || null;
        
        if (sk46State.provider === providerId) sk46State.model = saved;
        return saved;
    }

    function sk46EffectiveAudioModel() {
        const p = sk46EffectiveAudioProvider();
        const saved = (sk46State.audioModels && sk46State.audioModels[p])
            || SK46_STT_DEFAULT_MODELS[p]
            || null;
        sk46State.audioModel = saved;
        return saved;
    }

    let sk46PageKind = 'unknown';
    let sk46ChatColumns = null;
    let sk46LastKnownChatColumns = null;

    let sk46TextEntries = [];
    let sk46LastNodes = [];
    let sk46LastRebuildAt = null;
    let sk46HostObserver = null;
    let sk46StyleObserver = null;
    let sk46RafLoopId = null;
    let sk46StickyScrollRafPending = false;
    let sk46RebuildTimer = null;

    let sk46HoverEnabled = false;
    let sk46HoverPoint = null;
    let sk46HoverDirty = false;
    let sk46HoverEntry = null;
    let sk46HoverPending = null;
    let sk46HoverTimer = null;

    let sk46StickyCandidates = new Map();
    let sk46StickyBoundary = 0;
    let sk46LastScrollCheckPositions = new Map();

    let sk46LastMaskKey = '';
    let sk46LastRebuildPath = '';

    let sk46AudioEntries = [];
    let sk46PopupEntry = null;
    let sk46PopupHideAt = null;

    let sk46SenderColor = null;
    let sk46SenderColorPath = null;
    let sk46RefreshBtnSizePx = 24;
    let sk46RefreshBtnOffsetXPx = 68;
    let sk46RefreshBtnOffsetYPx = -32;

    let sk46SenderColorRetryTimer = null;
    let sk46SenderColorRetryCount = 0;
    const SK46_SENDER_COLOR_MAX_RETRIES = 60;

    const SK46_GOOGLE_FONTS_HREF =
        'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600&family=Noto+Color+Emoji&display=swap';

    function sk46InjectFontLink() {
        for (const host of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
            if (!document.querySelector(`link[rel="preconnect"][href="${host}"]`)) {
                const pc = document.createElement('link');
                pc.rel = 'preconnect';
                pc.href = host;
                pc.crossOrigin = 'anonymous';
                document.head.appendChild(pc);
            }
        }
        if (!document.querySelector(`link[data-sk46-fonts="1"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = SK46_GOOGLE_FONTS_HREF;
            link.dataset.sk46Fonts = '1';
            link.addEventListener('load', () => void 0);
            link.addEventListener('error', () => void 0);
            document.head.appendChild(link);
        }
    }

    const SK46_CHAT_URL_RE = /\/talk\/timeline\/[^\/]+\/?$/;
    
    const SK46_TALK_HUB_URL_RE = /\/organization\/[^\/]+\/talk\/?$/;
    function sk46IsTalkHubPage() {
        return SK46_TALK_HUB_URL_RE.test(location.pathname);
    }
    const SK46_MENU_ITEM_TEXTS = ['Search by date', 'Background design', 'Show all unread messages', 'Sent letters'];
    const SK46_MENU_MIN_MATCHES = 2;
    const SK46_CALENDAR_CELL_RE = /^\w+day, \w+ \d{1,2}, \d{4}$/;
    const SK46_CALENDAR_MIN_CELLS = 5;
    const SK46_NON_CHAT_SUBROUTES = ['/media-list', '/edit-background'];
    const SK46_JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/;
    function sk46HasJapanese(text) { return SK46_JAPANESE_RE.test(text); }

    function sk46DetectNonChatPage(nodes) {
        if (!SK46_CHAT_URL_RE.test(location.pathname)) return true;
        for (const seg of SK46_NON_CHAT_SUBROUTES) {
            if (location.pathname.endsWith(seg) || location.pathname.includes(seg + '/')) return true;
        }
        
        if (!sk46GetHeaderRowBounds()) return true;
        const textLeaves = nodes.filter(n => n.category === 'text');
        let menuMatches = 0;
        for (const item of SK46_MENU_ITEM_TEXTS) {
            if (textLeaves.some(n => n.text.trim() === item)) menuMatches++;
        }
        if (menuMatches >= SK46_MENU_MIN_MATCHES) return true;
        let calendarCells = 0;
        for (const n of textLeaves) {
            if (SK46_CALENDAR_CELL_RE.test(n.text.trim())) calendarCells++;
        }
        if (calendarCells >= SK46_CALENDAR_MIN_CELLS) return true;
        return false;
    }

    const SK46_CHAT_COLUMN_TOLERANCE_PX = 20;
    function sk46ComputeChatColumns(nodes) {
        const japaneseLeaves = nodes.filter(n => n.category === 'text' && sk46HasJapanese(n.text));
        if (japaneseLeaves.length === 0) return sk46LastKnownChatColumns;
        const xs = [];
        for (const n of japaneseLeaves) {
            const x = n.rect.left;
            if (!xs.some(e => Math.abs(e - x) < SK46_CHAT_COLUMN_TOLERANCE_PX)) xs.push(x);
        }
        sk46LastKnownChatColumns = xs;
        return xs;
    }

    const SK46_UNREAD_OVERLAY_MIN_WIDTH_PX = 400;

    let sk46UnreadSuppressed = 0;

    function sk46FindUnreadTextEls(nodes) {
        const unreadEls = new Set();
        for (const n of nodes) {
            if (n.category !== 'text') continue;
            const parent = n.el.parentElement;
            if (!parent || parent.getAttribute('role') !== 'group') continue;
            for (const child of parent.children) {
                if (child === n.el) continue;
                if (child.tagName.toLowerCase() !== 'flt-semantics') continue;
                if (child.getAttribute('role') !== 'button') continue;
                if ((child.textContent || '').trim()) continue;
                const r = child.getBoundingClientRect();
                if (r.width > SK46_UNREAD_OVERLAY_MIN_WIDTH_PX) { unreadEls.add(n.el); break; }
            }
        }

        sk46UnreadSuppressed = unreadEls.size;
        return unreadEls;
    }

    const sk46OverlayLayer = document.createElement('div');
    sk46OverlayLayer.id = 'sk46-wireframe-layer';
    sk46OverlayLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;display:none;';

    const sk46MirrorLayer = document.createElement('div');
    sk46MirrorLayer.id = 'sk46-mirror-layer';
    sk46MirrorLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';

    const sk46MirrorBgLayer = document.createElement('div');
    sk46MirrorBgLayer.id = 'sk46-mirror-bg-layer';
    sk46MirrorBgLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';

    const sk46RefreshLayer = document.createElement('div');
    sk46RefreshLayer.id = 'sk46-refresh-layer';
    sk46RefreshLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483400;';

    const SK46_MASKED_LAYERS = [sk46OverlayLayer, sk46MirrorLayer, sk46MirrorBgLayer];

    const SK46_MIRROR_CONTAINER_PAD_Y = 25;
    const SK46_MIRROR_TEXT_PAD = 2;
    const SK46_MIRROR_FONT_PX = 13;
    const SK46_MIRROR_LINE_HEIGHT_RATIO = 1.82;
    const SK46_TEXT_MIRROR_MIN_HEIGHT_PX = 40;
    const SK46_MIRROR_FONT_FAMILY =
        '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", Meiryo, "Noto Sans CJK JP", sans-serif, "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"';
    const SK46_APP_PINK = SK46_GROUP.accent;
    const SK46_TRANSLATE_BTN_COLOR =
        SK46_GROUP.id === 'nogi' || SK46_GROUP.id === 'hinata'
            ? '#ffffff'
            : SK46_APP_PINK;

    const SK46_ICON_TRANSLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="m476-100 178.15-460h62.46l178.16 460h-63.62l-45.3-122H584.92l-45.31 122H476ZM160.38-217.69l-42.15-42.16 198.92-199.3q-34.61-35-65.8-83.08Q220.15-590.31 200-640h63.61q17.31 36.31 42.12 72.62 24.81 36.3 53.58 66.07 42.61-43 80.61-104.42T493.62-720H67.69v-60H330v-64.61h60V-780h262.31v60h-97.93q-19.46 67.38-62.03 140.88-42.58 73.5-90.89 121.2l98.69 101.07-22.69 61.62-118.15-121.16-198.93 198.7Zm443.77-57.39h162.46l-81.23-218.23-81.23 218.23Z"/></svg>`;
    const SK46_ICON_LANGUAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M332.5-129.96q-69.35-29.96-120.96-81.58-51.62-51.61-81.58-120.96T100-480.31q0-78.46 29.96-147.5t81.58-120.65q51.61-51.62 120.96-81.58T480.31-860q78.46 0 147.5 29.96t120.65 81.58q51.62 51.61 81.58 120.65T860-480.31q0 78.46-29.96 147.81-29.96 69.35-81.58 120.96-51.61 51.62-120.65 81.58T480.31-100q-78.46 0-147.81-29.96ZM480-160.85q30.62-40.61 51.54-81.92 20.92-41.31 34.08-90.31H394.38q13.93 50.54 34.47 91.85 20.53 41.31 51.15 80.38Zm-77.46-11q-23-33-41.31-75.03-18.31-42.04-28.46-86.2H197.08q31.69 62.31 85 104.7 53.31 42.38 120.46 56.53Zm154.92 0q67.15-14.15 120.46-56.53 53.31-42.39 85-104.7H627.23q-12.08 44.54-30.39 86.58-18.3 42.04-39.38 74.65ZM171.92-393.08h148.7q-3.77-22.3-5.47-43.73-1.69-21.42-1.69-43.19 0-21.77 1.69-43.19 1.7-21.43 5.47-43.73h-148.7q-5.77 20.38-8.84 42.38-3.08 22-3.08 44.54t3.08 44.54q3.07 22 8.84 42.38Zm208.69 0h198.78q3.76-22.3 5.46-43.34 1.69-21.04 1.69-43.58t-1.69-43.58q-1.7-21.04-5.46-43.34H380.61q-3.76 22.3-5.46 43.34-1.69 21.04-1.69 43.58t1.69 43.58q1.7 21.04 5.46 43.34Zm258.77 0h148.7q5.77-20.38 8.84-42.38 3.08-22 3.08-44.54t-3.08-44.54q-3.07-22-8.84-42.38h-148.7q3.77 22.3 5.47 43.73 1.69 21.42 1.69 43.19 0 21.77-1.69 43.19-1.7 21.43-5.47 43.73Zm-12.15-233.84h135.69Q730.85-690 678.5-731.62q-52.35-41.61-121.04-56.92 23 34.92 40.92 76.39 17.93 41.46 28.85 85.23Zm-232.85 0h171.24q-13.93-50.16-35.04-92.43-21.12-42.27-50.58-79.8-29.46 37.53-50.58 79.8-21.11 42.27-35.04 92.43Zm-197.3 0h135.69q10.92-43.77 28.85-85.23 17.92-41.47 40.92-76.39-69.08 15.31-121.23 57.12-52.16 41.8-84.23 104.5Z"/></svg>`;
    const SK46_ICON_PROVIDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="m387.69-100-15.23-121.85q-16.07-5.38-32.96-15.07-16.88-9.7-30.19-20.77L196.46-210l-92.3-160 97.61-73.77q-1.38-8.92-1.96-17.92-.58-9-.58-17.93 0-8.53.58-17.34t1.96-19.27L104.16-590l92.3-159.23 112.46 47.31q14.47-11.46 30.89-20.96t32.27-15.27L387.69-860h184.62l15.23 122.23q18 6.54 32.57 15.27 14.58 8.73 29.43 20.58l114-47.31L855.84-590l-99.15 74.92q2.15 9.69 2.35 18.12.19 8.42.19 16.96 0 8.15-.39 16.58-.38 8.42-2.76 19.27L854.46-370l-92.31 160-112.61-48.08q-14.85 11.85-30.31 20.96-15.46 9.12-31.69 14.89L572.31-100H387.69ZM440-160h78.62L533-267.15q30.62-8 55.96-22.73 25.35-14.74 48.89-37.89L737.23-286l39.39-68-86.77-65.38q5-15.54 6.8-30.47 1.81-14.92 1.81-30.15 0-15.62-1.81-30.15-1.8-14.54-6.8-29.7L777.38-606 738-674l-100.54 42.38q-20.08-21.46-48.11-37.92-28.04-16.46-56.73-23.31L520-800h-79.38l-13.24 106.77q-30.61 7.23-56.53 22.15-25.93 14.93-49.47 38.46L222-674l-39.38 68L269-541.62q-5 14.24-7 29.62t-2 32.38q0 15.62 2 30.62 2 15 6.62 29.62l-86 65.38L222-286l99-42q22.77 23.38 48.69 38.31 25.93 14.92 57.31 22.92L440-160Zm40.46-200q49.92 0 84.96-35.04 35.04-35.04 35.04-84.96 0-49.92-35.04-84.96Q530.38-600 480.46-600q-50.54 0-85.27 35.04T360.46-480q0 49.92 34.73 84.96Q429.92-360 480.46-360ZM480-480Z"/></svg>`;
    const SK46_ICON_PRESET = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M240.92-268.31q51-37.84 111.12-59.77Q412.15-350 480-350t127.96 21.92q60.12 21.93 111.12 59.77 37.3-41 59.11-94.92Q800-417.15 800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 62.85 21.81 116.77 21.81 53.92 59.11 94.92Zm146.7-219.31Q350-525.23 350-580q0-54.77 37.62-92.38Q425.23-710 480-710q54.77 0 92.38 37.62Q610-634.77 610-580q0 54.77-37.62 92.38Q534.77-450 480-450q-54.77 0-92.38-37.62ZM480-100q-79.15 0-148.5-29.77t-120.65-81.08q-51.31-51.3-81.08-120.65Q100-400.85 100-480t29.77-148.5q29.77-69.35 81.08-120.65 51.3-51.31 120.65-81.08Q400.85-860 480-860t148.5 29.77q69.35 29.77 120.65 81.08 51.31 51.3 81.08 120.65Q860-559.15 860-480t-29.77 148.5q-29.77 69.35-81.08 120.65-51.3 51.31-120.65 81.08Q559.15-100 480-100Zm104.42-77.42q50.27-17.43 89.27-48.73-39-30.16-88.11-47Q536.46-290 480-290t-105.77 16.65q-49.31 16.66-87.92 47.2 39 31.3 89.27 48.73Q425.85-160 480-160t104.42-17.42Zm-54.5-352.66Q550-550.15 550-580t-20.08-49.92Q509.85-650 480-650t-49.92 20.08Q410-609.85 410-580t20.08 49.92Q450.15-510 480-510t49.92-20.08ZM480-580Zm0 355Z"/></svg>`;
    const SK46_ICON_CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M321-61.91 231.91-151l329-329-329-329L321-898.09 739.09-480 321-61.91Z"/></svg>`;
    const SK46_ICON_BACK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-245 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M400-107.69 27.69-480 400-852.31l42.54 42.54L112.77-480l329.77 329.77L400-107.69Z"/></svg>`;
    const SK46_ICON_INFO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M440-280h80v-240h-80v240Zm68.5-331.5Q520-623 520-640t-11.5-28.5Q497-680 480-680t-28.5 11.5Q440-657 440-640t11.5 28.5Q463-600 480-600t28.5-11.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`;
    
    const SK46_ICON_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-100.77q-129.77-35.39-214.88-152.77Q180-370.92 180-516v-230.15l300-112.31 300 112.31V-516q0 76.15-24.96 147.73-24.96 71.58-73.96 131.19l-125.7-125.69q-16.46 11.38-35.8 17.08Q500.23-340 480-340q-57.75 0-98.87-41.13Q340-422.25 340-480q0-57.75 41.04-98.87Q422.08-620 480-620q57.92 0 98.96 41.13Q620-537.75 620-480q0 20.25-5.5 39.13-5.5 18.87-15.73 35.95l74.61 74.61q21.54-42.15 34.08-88.5Q720-465.15 720-516v-189l-240-89.62L240-705v189q0 121 68 220t172 132q26-8 49.5-20.5T576-214l40.61 42.92q-31.46 24.31-64.76 41.81-33.31 17.5-71.85 28.5Zm56.5-322.73Q560-447 560-480t-23.5-56.5Q513-560 480-560t-56.5 23.5Q400-513 400-480t23.5 56.5Q447-400 480-400t56.5-23.5Zm-51.58-54.27Z"/></svg>`;

    const SK46_ICON_REFRESH = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M481.54-180q-125.63 0-212.81-87.17-87.19-87.17-87.19-212.77 0-125.6 87.19-212.83Q355.91-780 481.54-780q70.15 0 132.77 31.19 62.61 31.2 104.15 88.04V-780h60v244.61H533.85v-59.99h158q-31.62-57.93-87.7-91.27Q548.08-720 481.54-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h63.23q-27.23 97.92-107.27 158.96Q583.46-180 481.54-180Z"/></svg>`;
    const SK46_ICON_TRANSCRIPT = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" aria-hidden="true"><path d="M670.07-562.31q-28.84 0-49.45-20.12Q600-602.56 600-632.31V-800q0-29.75 20.57-49.87Q641.13-870 670.01-870q29.76 0 49.87 20.13Q740-829.75 740-800v167.69q0 29.75-20.1 49.88-20.11 20.12-49.83 20.12ZM212.31-100q-29.83 0-51.07-21.24Q140-142.48 140-172.31v-615.38q0-29.83 21.24-51.07Q182.48-860 212.31-860H510v60H212.31q-5.39 0-8.85 3.46t-3.46 8.85v615.38q0 5.39 3.46 8.85t8.85 3.46h415.38q5.39 0 8.85-3.46t3.46-8.85v-73.08h60v72.92q0 30.08-21.24 51.28Q657.52-100 627.69-100H212.31ZM290-245.39V-310h260v64.61H290Zm0-120v-59.99h180v59.99H290ZM700-330h-60v-102.46Q564.54-443 512.27-499.08 460-555.15 460-632.31h60q0 59.93 44.46 101.12Q608.92-490 669.97-490q62.11 0 106.07-41.19Q820-572.38 820-632.31h60q0 77.54-51.77 133.43Q776.46-443 700-432.46V-330Z"/></svg>`;

    const sk46OverlayStyle = document.createElement('style');
    sk46OverlayStyle.textContent = `
        #sk46-wireframe-layer, #sk46-mirror-layer {
            font: 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
            transform: translateZ(0);
            will-change: transform, contents;
            backface-visibility: hidden;
        }
        .sk46-wf-box { position: fixed; box-sizing: border-box; pointer-events: none; }
        .sk46-wf-text { border: 1.5px solid #3b82f6; background: rgba(59,130,246,.14); }
        .sk46-wf-empty-square { border: 1.5px dashed #f59e0b; background: rgba(245,158,11,.08); }
        .sk46-wf-empty-wide { border: 1.5px dashed #a855f7; background: rgba(168,85,247,.08); }
        .sk46-wf-empty-tall { border: 1.5px dashed #14b8a6; background: rgba(20,184,166,.08); }
        .sk46-wf-empty-zero { display: none; }
        .sk46-wf-container { border: 1px dotted rgba(148,163,184,.55); background: transparent; }
        .sk46-wf-label {
            position: absolute; top: -15px; left: 0;
            background: #111827; color: #e5e7eb; padding: 1px 3px; border-radius: 2px;
            white-space: nowrap; pointer-events: none;
        }
        .sk46-mirror-container {
            position: fixed; box-sizing: border-box; pointer-events: none;
            background: transparent;
            transition: opacity 0.15s ease;
        }
        .sk46-mirror-text {
            padding: ${SK46_MIRROR_TEXT_PAD}px;
            color: #dc2626; font-weight: 600;
            font-size: ${SK46_MIRROR_FONT_PX}px;
            line-height: ${SK46_MIRROR_LINE_HEIGHT_RATIO};
            font-family: ${SK46_MIRROR_FONT_FAMILY};
            text-shadow: 0 0 2px #fff, 0 0 3px #fff, 0 0 4px #fff;
            white-space: pre-wrap;
            word-break: normal;
            overflow-wrap: break-word;
            will-change: contents, transform;
        }
        .sk46-mirror-text--preview { color: #1a1a1a; font-weight: 400; text-shadow: none; }
        .sk46-mirror-bg {
            position: fixed; box-sizing: border-box; pointer-events: none;
            background: rgba(100,116,139,.18);
            border: 1.5px dashed #64748b;
            transition: opacity 0.15s ease;
        }
        .sk46-mirror-bg--preview { background: #F7F7F7; border-color: transparent; }
        /* Kursor di atas overlay: fade supaya teks asli di baliknya terlihat (lihat sk46UpdateHoverPeek). */
        .sk46-hover-fade { opacity: 0; }
        #sk46-translate-btn {
            position: fixed; display: none; padding: 0; margin: 0;
            border: none; background: transparent;
            color: ${SK46_TRANSLATE_BTN_COLOR}; cursor: pointer;
            -webkit-tap-highlight-color: transparent;
            z-index: 2147483450; pointer-events: auto;
            transition: opacity 0.15s ease;
            align-items: center; justify-content: center;
        }
        #sk46-translate-btn:hover { opacity: 0.7; }
        #sk46-translate-btn:active { opacity: 0.45; }
        #sk46-translate-btn svg { width: 50%; height: 50%; display: block; }
        @keyframes sk46-refresh-spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        #sk46-refresh-layer { --sk46-sender-color: #888; }
        .sk46-refresh-btn {
            position: fixed;
            display: flex; align-items: center; justify-content: center;
            padding: 0; margin: 0; border: none; background: transparent;
            color: var(--sk46-sender-color, #888);
            cursor: pointer;
            pointer-events: auto;
            -webkit-tap-highlight-color: transparent;
            opacity: 0.85;
            transition: opacity 0.15s ease;
        }
        .sk46-refresh-btn:hover { opacity: 1; }
        .sk46-refresh-btn:active { opacity: 0.5; }
        .sk46-refresh-btn svg {
            width: 100%; height: 100%; display: block;
            transform-origin: 50% 50%;
        }
        .sk46-refresh-btn.spinning svg {
            animation: sk46-refresh-spin 0.9s linear infinite;
        }
        .sk46-transcript-btn { color: var(--sk46-sender-color, #888); }
        .sk46-fab-fallback {
            position: fixed !important;
            display: flex !important;
            right: 16px !important;
            bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: #FFFFFF !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22) !important;
            z-index: 2147483450 !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: auto !important;
            border: 1px solid rgba(0, 0, 0, 0.08) !important;
        }
        .sk46-fab-fallback svg {
            width: 22px !important;
            height: 22px !important;
        }
        @media (max-width: 600px) {
            #sheet {
                width: 100% !important;
                max-width: 100% !important;
                border-radius: 16px 16px 0 0 !important;
                max-height: calc(100dvh - 30px) !important;
                padding-bottom: env(safe-area-inset-bottom, 16px) !important;
            }
        }
    `;

    const sk46PopupHost = document.createElement('div');
    sk46PopupHost.id = 'sk46-popup-host';
    sk46PopupHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483500;';
    const sk46PopupShadow = sk46PopupHost.attachShadow({ mode: 'open' });
    sk46PopupShadow.innerHTML = `
        <style>
            :host { all: initial; }
            * { box-sizing: border-box; font-family: ${SK46_MIRROR_FONT_FAMILY}; }
            #popup-card {
                position: fixed; display: none; pointer-events: auto;
                width: 420px; max-width: calc(100vw - 24px);
                background: #ffffff; color: #1a1a1a;
border-radius: 12px;
                box-shadow: none;
                overflow: hidden;
                font-size: 14px; line-height: 1.7;
            }
            #popup-card.visible { display: block; }
            #popup-backdrop {
                position: fixed; inset: 0; display: none;
                background: rgba(0, 0, 0, .4);
                pointer-events: none;
            }
            #popup-backdrop.visible { display: block; }
            #popup-tabs { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f7f7f7; border-bottom: 1px solid #ececec; }
            .tab {
                padding: 5px 12px; border-radius: 999px; cursor: pointer; user-select: none;
                font-size: 13px; color: #8e8e8e; transition: background .15s ease, color .15s ease;
                -webkit-tap-highlight-color: transparent;
            }
            .tab.active { background: ${SK46_APP_PINK}; color: #fff; }
            #popup-body { padding: 14px; max-height: 40vh; overflow-y: auto; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; }
            #popup-body.mono { font-family: ${SK46_MIRROR_FONT_FAMILY}; }
/* Karaoke: teks yang belum terdengar tampil redup. Yang sudah mulai
               (< currentTime) dibiarkan hitam; kata yang SEDANG terdengar
               diberi penekanan visual. Berlaku untuk transkrip (per kata)
               maupun terjemahan (per segmen). */
            #popup-body .sk46-w { color: #c9c9ce; transition: color .08s linear; }
            #popup-body .sk46-w.past { color: #000; }
            #popup-body .sk46-w.on { color: #000; font-weight: 600; }
            #popup-body:not(.karaoke) .sk46-w { color: inherit; font-weight: inherit; }
            #popup-body.karaoke { -webkit-font-smoothing: antialiased; }
            /* Tanpa timing kata (model STT berbasis audio-understanding), teks
               ditampilkan penuh seperti saat popup dibuka lewat tombol
               transcript: hitam, tidak pernah diredupkan meski audio diputar. */
            #popup-body.plain { color: #000; }
            #popup-body.plain .sk46-w,
            #popup-body.plain.karaoke .sk46-w { color: #000 !important; font-weight: inherit; }
            #popup-status { padding: 10px 14px; font-size: 13px; color: #9E9E9E; border-top: 1px solid #f0f0f0; display: none; align-items: center; gap: 8px; }
            #popup-status.visible { display: flex; }
            #popup-retry { all: unset; cursor: pointer; color: ${SK46_APP_PINK}; font-size: 13px; text-decoration: underline; }
        </style>
        <div id="popup-backdrop"></div>
        <div id="popup-card" role="dialog" aria-label="Transcript">
            <div id="popup-tabs">
                <div class="tab active" data-tab="original">Original</div>
                <div class="tab" data-tab="translated">Translation</div>
            </div>
            <div id="popup-body"></div>
            <div id="popup-status"><span id="popup-status-text"></span><span id="popup-retry">Retry</span></div>
        </div>
    `;
    const sk46PopupCard = sk46PopupShadow.getElementById('popup-card');
    const sk46PopupBackdrop = sk46PopupShadow.getElementById('popup-backdrop');

    function sk46HidePopupChrome() {
        sk46PopupCard.classList.remove('visible');
        sk46PopupBackdrop.classList.remove('visible');
    }    const sk46PopupBody = sk46PopupShadow.getElementById('popup-body');
    const sk46PopupStatus = sk46PopupShadow.getElementById('popup-status');
    const sk46PopupStatusText = sk46PopupShadow.getElementById('popup-status-text');
    const sk46PopupRetry = sk46PopupShadow.getElementById('popup-retry');
    let sk46PopupTab = 'original';
    
    let sk46PopupTabPinned = false;

    for (const t of sk46PopupShadow.querySelectorAll('.tab')) {
        t.addEventListener('click', () => {
            sk46PopupTab = t.getAttribute('data-tab');
            
            sk46PopupTabPinned = true;
            sk46RenderPopup(sk46PopupEntry);
        });
    }
    sk46PopupRetry.addEventListener('click', () => {
        
        if (sk46PopupEntry) sk46RunTranscription(sk46PopupEntry, true);
    });

function sk46ForwardWheelToFlutter(e) {
        const body = sk46PopupBody;
        const canScrollBody = body.scrollHeight - body.clientHeight > 1;
        if (canScrollBody) {
            const atTop = body.scrollTop <= 0;
            const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
            if (!((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) return;
        }
        e.preventDefault();
        e.stopPropagation();
        const target = document.querySelector('flutter-view')
            || document.querySelector('flt-glass-pane')
            || document.body;
        if (!target) return;
        const ev = new WheelEvent('wheel', {
            deltaY: e.deltaY,
            deltaX: e.deltaX,
            deltaMode: e.deltaMode || 0,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true,
            cancelable: true,
        });
        target.dispatchEvent(ev);
    }

    function sk46ForwardTouchToFlutter(e) {
        const body = sk46PopupBody;
        const canScrollBody = body.scrollHeight - body.clientHeight > 1;
        if (canScrollBody) {
            const atTop = body.scrollTop <= 0;
            const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
            const dy = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
            if (!((dy > 0 && atTop) || (dy < 0 && atBottom))) return;
        }
        e.preventDefault();
        e.stopPropagation();
        const target = document.querySelector('flutter-view')
            || document.querySelector('flt-glass-pane')
            || document.body;
        if (!target) return;
        const t = e.touches && e.touches[0];
        const init = {
            bubbles: true, cancelable: true,
            touches: e.touches ? Array.from(e.touches).map(x => new Touch({ identifier: x.identifier, target: target, clientX: x.clientX, clientY: x.clientY })) : [],
        };
        try { target.dispatchEvent(new TouchEvent('touchmove', init)); }
        catch {  }
    }

    sk46PopupCard.addEventListener('wheel', sk46ForwardWheelToFlutter, { passive: false });
    sk46PopupCard.addEventListener('touchmove', sk46ForwardTouchToFlutter, { passive: false });

    sk46PopupCard.addEventListener('mousedown', (e) => e.stopPropagation());

    let sk46HudHost = null;
    let sk46El = null;
    
    const SK46_FLUTTER_HOST = 'flt-semantics-host';
    function sk46CurrentChatMember() {
        try {
            const h2 = document.querySelector(`${SK46_FLUTTER_HOST} h2`);
            if (!h2) return '';
            const text = (h2.textContent || '').trim();
            if (text && text.length < 50) return text;
        } catch {}
        return '';
    }
    function sk46FindActivationButton() {
        return document.querySelector('[aria-label="Enable accessibility"]')
            || document.querySelector('flt-semantics-placeholder');
    }
    function sk46TryActivateSemantics() {
        const btn = sk46FindActivationButton();
        if (btn) { btn.click(); return 'clicked'; }
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (host && host.childElementCount > 0) return 'already-active';
        return 'not-found';
    }

    let sk46BodyObserver = null;
    let sk46ActivationPollTimer = null;
    function sk46StopWatchingForButton() {
        if (sk46BodyObserver) { sk46BodyObserver.disconnect(); sk46BodyObserver = null; }
        if (sk46ActivationPollTimer) { clearInterval(sk46ActivationPollTimer); sk46ActivationPollTimer = null; }
    }
    function sk46WatchForActivationButton() {
        const initial = sk46TryActivateSemantics();
        if (initial !== 'not-found') return;
        sk46BodyObserver = new MutationObserver(() => {
            const btn = sk46FindActivationButton();
            if (btn) { btn.click(); sk46StopWatchingForButton(); }
        });
        sk46BodyObserver.observe(document.body, { childList: true, subtree: true });
        let pollCount = 0;
        sk46ActivationPollTimer = setInterval(() => {
            pollCount++;
            const btn = sk46FindActivationButton();
            if (btn) { btn.click(); sk46StopWatchingForButton(); return; }
            const host = document.querySelector(SK46_FLUTTER_HOST);
            if ((host && host.childElementCount > 0) || pollCount >= 40) sk46StopWatchingForButton();
        }, 500);
    }

    function sk46WatchHost() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) { setTimeout(sk46WatchHost, 500); return; }
        if (sk46HostObserver) sk46HostObserver.disconnect();
        sk46HostObserver = new MutationObserver(() => sk46ScheduleRebuild());
        sk46HostObserver.observe(host, { childList: true, subtree: true, characterData: true });
        if (sk46El) sk46El.status.textContent = 'flt-semantics-host terpasang, mengamati perubahan…';
        sk46FullRebuild();
        sk46WatchStyles(host);
    }
    function sk46WatchStyles(host) {
        if (sk46StyleObserver) sk46StyleObserver.disconnect();
        sk46StyleObserver = new MutationObserver(() => sk46Reposition());
        sk46StyleObserver.observe(host, { subtree: true, attributes: true, attributeFilter: ['style'] });
    }

    function sk46ClassifyTree(host) {
        if (!host) return [];
        const all = Array.from(host.querySelectorAll('flt-semantics, flt-semantics-container'));
        return all.map((el, i) => {
            const isLeaf = !el.querySelector('flt-semantics, flt-semantics-container');
            const rect = el.getBoundingClientRect();
            const text = (el.textContent || '').trim();
            const chain = [];
            let p = el.parentElement;
            while (p && p !== host) { chain.unshift(p.tagName.toLowerCase()); p = p.parentElement; }
            let category;
            if (!isLeaf) category = 'container';
            else if (text) category = 'text';
            else if (rect.width === 0 || rect.height === 0) category = 'empty-zero';
            else {
                const ratio = rect.width / rect.height;
                category = ratio >= 0.7 && ratio <= 1.4 ? 'empty-square'
                         : ratio > 1.4 ? 'empty-wide' : 'empty-tall';
            }
            return { el, index: i, tag: el.tagName.toLowerCase(), depth: chain.length, isLeaf, category, text, rect, chain };
        });
    }

    function sk46IsRealTextMessage(n, chatColumns, unreadEls) {
        if (n.category !== 'text') return false;
        if (n.rect.height < SK46_TEXT_MIRROR_MIN_HEIGHT_PX) return false;
        if (unreadEls && unreadEls.has(n.el)) return false;
        if (sk46HasJapanese(n.text)) return true;
        if (!chatColumns || chatColumns.length === 0) return true;
        for (const x of chatColumns) {
            if (Math.abs(n.rect.left - x) < SK46_CHAT_COLUMN_TOLERANCE_PX) return true;
        }
        return false;
    }

    const SK46_STICKY_EPSILON_PX = 0.5;
    const SK46_STICKY_CONFIRM_STREAK = 2;
    const SK46_STICKY_CANDIDATE_MAX_TOP = 200;
    const SK46_STICKY_CANDIDATE_MAX_BOTTOM = 150;
    const SK46_TOP_BOUNDARY_TOLERANCE_PX = 2;
    const SK46_TOP_BOUNDARY_SAFE_MARGIN_PX =
        8 * (SK46_MIRROR_FONT_PX * SK46_MIRROR_LINE_HEIGHT_RATIO) + 2 * SK46_MIRROR_CONTAINER_PAD_Y;
    const SK46_BOOTSTRAP_TOP_TOLERANCE_PX = 5;
    const SK46_BOOTSTRAP_MIN_HEIGHT_PX = 20;

    function sk46GetHeaderRowBounds() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return null;
        const h2 = host.querySelector('h2');
        if (!h2) return null;
        const h2Rect = h2.getBoundingClientRect();
        if (h2Rect.width < 80 || h2Rect.height === 0 || h2Rect.height > 60) return null;
        if (h2Rect.bottom <= 0) return null;
        const parent = h2.parentElement;
        if (!parent) return null;
        const pr = parent.getBoundingClientRect();
        if (pr.height === 0 || pr.height > 200) return null;
        if (pr.bottom <= 0) return null;
        if (pr.top >= window.innerHeight) return null;
        return { top: pr.top, bottom: pr.bottom, h2Rect };
    }

    function sk46BootstrapStickyBoundary(nodes) {
        const header = sk46GetHeaderRowBounds();
        if (header) {
            const newBottom = header.bottom;
            if (Math.abs(sk46StickyBoundary - newBottom) > SK46_STICKY_EPSILON_PX) {
                ;
            }
            sk46StickyBoundary = newBottom;
            return;
        }
        if (sk46StickyBoundary > 0) return;
        let maxBottom = 0;
        for (const n of nodes) {
            const r = n.rect;
            if (r.top > SK46_BOOTSTRAP_TOP_TOLERANCE_PX) continue;
            if (r.bottom > SK46_STICKY_CANDIDATE_MAX_BOTTOM) continue;
            if (r.bottom < SK46_BOOTSTRAP_MIN_HEIGHT_PX) continue;
            if (r.bottom > maxBottom) maxBottom = r.bottom;
        }
        if (maxBottom > 0) sk46StickyBoundary = maxBottom;
    }

    function sk46UpdateStickyTracking(items) {
        const header = sk46GetHeaderRowBounds();
        if (header) {
            const newBottom = header.bottom;
            if (Math.abs(sk46StickyBoundary - newBottom) > SK46_STICKY_EPSILON_PX) {
                ;
            }
            sk46StickyBoundary = newBottom;
            return;
        }
        let maxStickyBottom = 0;
        let maxStickySourceEl = null;
        const seen = new Set();
        for (const { el, top, bottom } of items) {
            if (top > SK46_STICKY_CANDIDATE_MAX_TOP) { sk46StickyCandidates.delete(el); continue; }
            if (bottom > SK46_STICKY_CANDIDATE_MAX_BOTTOM) { sk46StickyCandidates.delete(el); continue; }
            seen.add(el);
            const prev = sk46StickyCandidates.get(el);
            const streak = (prev !== undefined && Math.abs(prev.top - top) < SK46_STICKY_EPSILON_PX)
                ? prev.streak + 1 : 1;
            sk46StickyCandidates.set(el, { top, streak });
            if (streak >= SK46_STICKY_CONFIRM_STREAK && bottom > maxStickyBottom) {
                maxStickyBottom = bottom;
                maxStickySourceEl = el;
            }
        }
        for (const el of sk46StickyCandidates.keys()) {
            if (!seen.has(el)) sk46StickyCandidates.delete(el);
        }
        if (maxStickyBottom > 0) {
            if (Math.abs(sk46StickyBoundary - maxStickyBottom) > SK46_STICKY_EPSILON_PX) {
                ;
            }
            sk46StickyBoundary = maxStickyBottom;
        }
    }

    function sk46IsAtTopBoundary(rect) {
        return rect.top <= sk46StickyBoundary + SK46_TOP_BOUNDARY_TOLERANCE_PX
            || rect.bottom <= sk46StickyBoundary + SK46_TOP_BOUNDARY_SAFE_MARGIN_PX;
    }
    function sk46IsAtTopBoundaryStrict(rect) {
        return rect.top <= sk46StickyBoundary + SK46_TOP_BOUNDARY_TOLERANCE_PX;
    }
    function sk46ApplyHeaderClip(el, rect, entry, which) {
        const rawInset = Math.max(0, sk46StickyBoundary - rect.top);
        const insetTop = Math.min(rawInset, rect.height);
        const val = insetTop > 0 ? `inset(${Math.round(insetTop)}px 0 0 0)` : 'none';
        if (entry) sk46DebugSeam.state(entry, which === 'mirror' ? 'clipMirror' : 'clipBg', val,
            `stickyBoundary=${Math.round(sk46StickyBoundary)} rectTop=${Math.round(rect.top)} rectH=${Math.round(rect.height)}`);
        el.style.clipPath = val === 'none' ? 'none' : val;
    }

    const SK46_BOTTOM_BOUNDARY_TOLERANCE_PX = 2;

    let sk46ChatScrollBottomBoundary = 0;
    let sk46ChatScrollContainerEl = null;
    let sk46BottomBoundarySource = 'init';
    let sk46CachedScrollContainerEl = null;

    const SK46_VIEWPORT_FILL_RATIO = 1.05;
    
    function sk46AcceptScrollContainer(el) {
        if (!el || !el.isConnected) return null;
        let r;
        try { r = el.getBoundingClientRect(); } catch { return null; }
        if (!r) return null;
        if (r.width <= 0 || r.height <= 0) return null;
        if (r.height < 120) return null;
        // Mobile: accept full-width elements; SK46_VIEWPORT_FILL_RATIO is 1.05 so this rarely fires
        if (r.width > window.innerWidth * SK46_VIEWPORT_FILL_RATIO && r.height > window.innerHeight * SK46_VIEWPORT_FILL_RATIO) return null;
        return r;
    }

    function sk46FindChatScrollContainer() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return null;
        if (sk46CachedScrollContainerEl) {
            const r = sk46AcceptScrollContainer(sk46CachedScrollContainerEl);
            if (r) return { el: sk46CachedScrollContainerEl, rect: r, source: 'cached' };
            sk46CachedScrollContainerEl = null;
        }
        try {
            for (const of2 of host.querySelectorAll('flt-semantics-scroll-overflow')) {
                const parent = of2.parentElement;
                if (!parent) continue;
                const r = sk46AcceptScrollContainer(parent);
                if (r) { sk46CachedScrollContainerEl = parent; return { el: parent, rect: r, source: 'scroll-overflow' }; }
            }
        } catch (e) {  }
        try {
            for (const el of host.querySelectorAll('flt-semantics[role="group"]')) {
                const styleAttr = el.getAttribute('style') || '';
                let oy = '';
                try { oy = getComputedStyle(el).overflowY || ''; } catch {}
                if (oy !== 'scroll' && oy !== 'auto'
                    && !/overflow-y\s*:\s*(scroll|auto)/i.test(styleAttr)) continue;
                const r = sk46AcceptScrollContainer(el);
                if (r) { sk46CachedScrollContainerEl = el; return { el, rect: r, source: 'role-group' }; }
            }
        } catch (e) {  }
        try {
            for (const leaf of host.querySelectorAll('flt-semantics')) {
                if (leaf.querySelector('flt-semantics, flt-semantics-container')) continue;
                const text = (leaf.textContent || '').trim();
                if (!text || !sk46HasJapanese(text)) continue;
                let p = leaf.parentElement;
                while (p && p !== host && p !== document.body) {
                    const styleAttr = p.getAttribute('style') || '';
                    let oy = '';
                    try { oy = getComputedStyle(p).overflowY || ''; } catch {}
                    if (oy === 'scroll' || oy === 'auto'
                        || /overflow-y\s*:\s*(scroll|auto)/i.test(styleAttr)) {
                        const r = sk46AcceptScrollContainer(p);
                        if (r) { sk46CachedScrollContainerEl = p; return { el: p, rect: r, source: 'walk-up' }; }
                    }
                    p = p.parentElement;
                }
            }
        } catch (e) {  }
        return null;
    }

    function sk46RefreshChatBottomBoundary() {
        let found = null;
        try { found = sk46FindChatScrollContainer(); } catch (e) { found = null; }
        if (found) {
            const bottom = found.rect.bottom;
            if (bottom > 0 && bottom <= window.innerHeight) {
                const prev = sk46ChatScrollBottomBoundary;
                const changed = Math.abs(prev - bottom) > SK46_STICKY_EPSILON_PX;
                sk46ChatScrollContainerEl = found.el;
                sk46ChatScrollBottomBoundary = bottom;
                sk46BottomBoundarySource = found.source;
                if (changed) {
                    ;
                }
                return;
            }
        }
        if (sk46ChatScrollBottomBoundary > 0
            && sk46ChatScrollBottomBoundary < window.innerHeight - 5) {
            sk46BottomBoundarySource = 'retained';
            return;
        }
        const prev = sk46ChatScrollBottomBoundary;
        sk46ChatScrollContainerEl = null;
        sk46ChatScrollBottomBoundary = window.innerHeight;
        sk46BottomBoundarySource = 'fallback';
        if (Math.abs(prev - sk46ChatScrollBottomBoundary) > SK46_STICKY_EPSILON_PX) {
            ;
        }
    }

    function sk46GetBottomLimit() {
        return sk46ChatScrollBottomBoundary > 0
            ? sk46ChatScrollBottomBoundary
            : window.innerHeight;
    }

    function sk46IsAtBottomBoundary(rect) {
        return rect.bottom >= sk46GetBottomLimit() - SK46_BOTTOM_BOUNDARY_TOLERANCE_PX;
    }

    function sk46CancelSenderColorRetry() {
        if (sk46SenderColorRetryTimer) {
            clearTimeout(sk46SenderColorRetryTimer);
            sk46SenderColorRetryTimer = null;
        }
    }

    function sk46ResetSenderColor() {
        sk46CancelSenderColorRetry();
        sk46SenderColorRetryCount = 0;
        sk46SenderColor = null;
        sk46SenderColorPath = null;
        sk46RefreshLayer.style.setProperty('--sk46-sender-color', '#888');
    }

    function sk46ScheduleSenderColorRetry() {
        const SK46_SENDER_COLOR_RETRY_INTERVAL_MS = 120;
        if (sk46SenderColor) return;
        if (sk46SenderColorRetryTimer) return;
        if (sk46SenderColorRetryCount >= SK46_SENDER_COLOR_MAX_RETRIES) {
            ;
            return;
        }
        sk46SenderColorRetryTimer = setTimeout(() => {
            sk46SenderColorRetryTimer = null;
            if (sk46SenderColor) return;
            sk46SenderColorRetryCount++;
            let ok = false;
            try { ok = sk46TryDetectSenderColor(false); } catch (e) { ok = false; }
            if (!ok) sk46ScheduleSenderColorRetry();
        }, SK46_SENDER_COLOR_RETRY_INTERVAL_MS);
    }

    function sk46LocateSenderColorTarget(log) {
        const hosts = document.querySelectorAll(SK46_FLUTTER_HOST);
        if (hosts.length === 0) { log('fail: no flt-semantics-host'); return null; }
        log('hosts count', hosts.length);

        let h2 = null, hostUsed = null;
        for (const h of hosts) {
            const candidate = h.querySelector('h2');
            if (candidate) { h2 = candidate; hostUsed = h; break; }
        }
        if (!h2) { log('fail: no h2 in any flt-semantics-host'); return null; }
        const memberName = (h2.textContent || '').trim();
        if (!memberName) { log('fail: empty member name'); return null; }
        log('member', JSON.stringify(memberName));

        const groups = hostUsed.querySelectorAll('flt-semantics[role="group"]');
        log('groups total', groups.length);
        let targetGroup = null;
        for (const g of groups) {
            const al = g.getAttribute('aria-label') || '';
            if (!al.includes('\n')) continue;
            if (!al.startsWith(memberName)) continue;
            const r = g.getBoundingClientRect();
            if (r.top < 80) continue;
            targetGroup = g;
            break;
        }
        if (!targetGroup) {
            const allALs = [];
            for (const g of groups) {
                const al = g.getAttribute('aria-label');
                if (al) allALs.push(al.replace(/\n/g, '\\n'));
            }
            log('fail: no matching group. available aria-labels:', allALs.slice(0, 8));
            return null;
        }
        log('target group aria', JSON.stringify(targetGroup.getAttribute('aria-label')));

        const gRect = targetGroup.getBoundingClientRect();

        let tsSpan = null;
        const spanTexts = [];
        for (const s of targetGroup.querySelectorAll('span')) {
            const t = (s.textContent || '').trim();
            spanTexts.push(t);
            if (/^\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}$/.test(t)) { tsSpan = s; break; }
        }

        let sampleRect;
        if (tsSpan) {
            const tsRect = tsSpan.getBoundingClientRect();
            sampleRect = {
                left:   gRect.left + 2,
                top:    tsRect.top,
                right:  tsRect.left - 5,
                bottom: tsRect.bottom,
            };
            log('tsSpan found', JSON.stringify(tsSpan.textContent));
        } else {
            sampleRect = {
                left:   gRect.left + 72,
                top:    gRect.top + 3,
                right:  gRect.left + 72 + 130,
                bottom: gRect.top + 3 + 18,
            };
            log('no tsSpan — fallback strip sample', {
                spanTexts, gRect: { left: Math.round(gRect.left), top: Math.round(gRect.top), w: Math.round(gRect.width), h: Math.round(gRect.height) },
            });
        }

        log('sample rect', {
            left: Math.round(sampleRect.left), top: Math.round(sampleRect.top),
            right: Math.round(sampleRect.right), bottom: Math.round(sampleRect.bottom),
        });
        if (sampleRect.right <= sampleRect.left || sampleRect.bottom <= sampleRect.top) {
            log('fail: bad sample rect (right<=left or bottom<=top)');
            return null;
        }
        return { memberName, sampleRect };
    }

    function sk46SenderColorSampleHex(canvas, sampleRect, log) {
        
        const SK46_CANVAS_WHITE_CHANNEL_MIN = 220;
        const c2 = document.createElement('canvas');
        c2.width = canvas.width;
        c2.height = canvas.height;
        const ctx = c2.getContext('2d', { willReadFrequently: true });
        try { ctx.drawImage(canvas, 0, 0); }
        catch (e) { log('fail: drawImage threw', String(e)); return null; }
        let img;
        try { img = ctx.getImageData(0, 0, c2.width, c2.height); }
        catch (e) { log('fail: getImageData threw', String(e)); return null; }

        const sx = canvas.width / (canvas.clientWidth || canvas.width);
        const sy = canvas.height / (canvas.clientHeight || canvas.height);
        const x0 = Math.max(0, Math.floor(sampleRect.left * sx));
        const y0 = Math.max(0, Math.floor(sampleRect.top * sy));
        const x1 = Math.min(canvas.width,  Math.ceil(sampleRect.right * sx));
        const y1 = Math.min(canvas.height, Math.ceil(sampleRect.bottom * sy));
        log('pixel region', { x0, y0, x1, y1, sx, sy });
        if (x1 <= x0 || y1 <= y0) { log('fail: empty pixel region'); return null; }

        const data = img.data;
        const W = c2.width;
        const candidates = [];
        let totalPixels = 0, transparentCount = 0, whiteCount = 0, grayCount = 0;
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                totalPixels++;
                const i = (y * W + x) * 4;
                const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
                if (a < 200) { transparentCount++; continue; }
                if (r > SK46_CANVAS_WHITE_CHANNEL_MIN && g > SK46_CANVAS_WHITE_CHANNEL_MIN && b > SK46_CANVAS_WHITE_CHANNEL_MIN) { whiteCount++; continue; }
                const sat = Math.max(r,g,b) - Math.min(r,g,b);
                const bright = (r + g + b) / 3;
                if (sat < 15) { grayCount++; }
                candidates.push({ r, g, b, sat, bright });
            }
        }
        log('pixel stats', { totalPixels, transparentCount, whiteCount, grayCount, candidates: candidates.length });

        if (candidates.length === 0) {
            if (transparentCount === totalPixels) {
                log('canvas not rendered yet (fully transparent) — retrying');
            } else {
                log('fail: no candidates');
            }
            return null;
        }

        candidates.sort((a, b) => {
            const sa = a.sat * 2 + (255 - a.bright);
            const sb = b.sat * 2 + (255 - b.bright);
            return sb - sa;
        });

        const take = Math.max(1, Math.floor(candidates.length * 0.2));
        let sr = 0, sg = 0, sb = 0;
        for (let i = 0; i < take; i++) { sr += candidates[i].r; sg += candidates[i].g; sb += candidates[i].b; }
        const ar = Math.round(sr / take);
        const ag = Math.round(sg / take);
        const ab = Math.round(sb / take);
        const hex = '#' + [ar, ag, ab].map(v => v.toString(16).padStart(2, '0')).join('');
        return { hex, candidateCount: candidates.length };
    }

    function sk46TryDetectSenderColor(verbose) {

        const log = (msg, extra) => {
            if (verbose || sk46DebugSeam.isEnabled()) {
                if (extra !== undefined) ;
                else ;
            }
        };

        if (sk46SenderColor && sk46SenderColorPath === location.pathname) {
            log('early-return: cached', sk46SenderColor);
            return true;
        }

        const pane = document.querySelector('flt-glass-pane');
        if (!pane) { log('fail: no flt-glass-pane'); return false; }
        if (!pane.shadowRoot) { log('fail: flt-glass-pane has no shadowRoot (closed?)'); return false; }
        const canvas = pane.shadowRoot.querySelector('canvas');
        if (!canvas) { log('fail: no canvas in shadowRoot'); return false; }
        log('canvas ok', { w: canvas.width, h: canvas.height, cw: canvas.clientWidth, ch: canvas.clientHeight });

        const target = sk46LocateSenderColorTarget(log);
        if (!target) return false;

        const sample = sk46SenderColorSampleHex(canvas, target.sampleRect, log);
        if (!sample) return false;

        const hex = sample.hex;
        sk46CancelSenderColorRetry();
        sk46SenderColorRetryCount = 0;
        sk46SenderColor = hex;
        sk46SenderColorPath = location.pathname;
        sk46RefreshLayer.style.setProperty('--sk46-sender-color', hex);
        ;
        return true;
    }

    const SK46_PLAY_TRIES = [
        { method: 'click-only', gapMs: 200 },
    ];

    const SK46_PLAY_WAIT_MS = 2500;

    function sk46PlayBtnFor(entry) {
        if (!entry || !entry.el) return null;
        
        const btn = entry.el.querySelector('flt-semantics[role="button"][flt-tappable]');
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        return btn;
    }

    function sk46DispatchPlayClick(btn, method) {
        const r = btn.getBoundingClientRect();
        const cx = Math.round(r.left + r.width / 2);
        const cy = Math.round(r.top + r.height / 2);
        try {
            if (method === 'native-click') {
                btn.click();
                return true;
            }
            
            const dispatched = btn.dispatchEvent(new MouseEvent('click', {
                bubbles: true, cancelable: true, composed: true,
                clientX: cx, clientY: cy, button: 0, buttons: 0, detail: 1,
            }));
            
            return dispatched !== false;
        } catch (e) {
            ;
            return false;
        }
    }

    function sk46TryActivatePlayForFetch(entry) {
        
        sk46MarkSyntheticPlay(entry);
        
        const deadline = Date.now() + SK46_PLAY_WAIT_MS;
        let sent = 0;
        let failed = 0;
        const attempt = () => {
            if (!entry) return;
            
            if (entry.url || sk46FindAudioUrlFor(entry.el)) {
                ;
                return;
            }
            if (entry.status === 'done' || entry.status === 'error') {
                ;
                return;
            }
            
            if (sk46AudioIsPlaying()) {
                
                ;
                
                sk46MarkWaitAsLoading(entry);
                sk46MaybeHaltPlayback(entry, 'playback-started');
                return;
            }
            if (Date.now() >= deadline) {
                ;
                sk46PromoteWaitToManual(entry);
                return;
            }
            
            const t = SK46_PLAY_TRIES[0];
            if (sent === 0) {
                const btn = sk46PlayBtnFor(entry);
                if (!btn) {
                    ;
                } else if (sk46DispatchPlayClick(btn, t.method)) {
                    sent++;
                    ;
                } else {
                    
                    failed++;
                    ;
                }
            }
            setTimeout(attempt, t.gapMs);
        };
        
        setTimeout(attempt, 50);
    }

    const sk46WaitingForUrl = new Map();

    function sk46MarkWaitAsLoading(entry) {
        if (!entry || !entry.waitingForUrl) return false;
        if (entry.waitingPhase === 'manual') return false;
        if (entry.waitingPhase === 'loading') return false;
        entry.waitingPhase = 'loading';
        sk46RenderPopup(entry);
        return true;
    }

    function sk46ArmWaitForAudioUrl(entry, phase) {
        sk46WaitingForUrl.set(entry, { at: Date.now(), phase: phase || 'trying' });
        entry.waitingForUrl = true;
        entry.waitingPhase = phase || 'trying';
        sk46RenderPopup(entry);
    }

    function sk46ClearWaitingForUrl(entry) {
        if (!entry || !entry.waitingForUrl) return false;
        entry.waitingForUrl = false;
        entry.waitingPhase = null;
        sk46WaitingForUrl.delete(entry);
        return true;
    }

    function sk46PromoteWaitToManual(entry) {
        if (!entry || !entry.waitingForUrl) return false;
        if (entry.waitingPhase === 'manual') return false;
        entry.waitingPhase = 'manual';
        ;
        sk46RenderPopup(entry);
        sk46UpdateTranscriptBtnState(entry);
        return true;
    }

    function sk46ResolveWaitingForUrl(entry) {
        if (!entry || !entry.waitingForUrl) return;
        if (entry.url || sk46FindAudioUrlFor(entry.el)) {
            sk46ClearWaitingForUrl(entry);
            
            if (entry.status === 'transcribing' || entry.status === 'translating') {
                sk46Trace('url:bound-while-resolving', { anchor: entry.anchorKey, status: entry.status });
                ;
                return;
            }
            ;
            sk46RunTranscription(entry);
        }
    }

    function sk46BuildTranscriptBtn(entry) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sk46-refresh-btn sk46-transcript-btn';
        btn.setAttribute('aria-label', 'Show transcript');
        btn.innerHTML = SK46_ICON_TRANSCRIPT;
        btn.style.width = sk46RefreshBtnSizePx + 'px';
        btn.style.height = sk46RefreshBtnSizePx + 'px';
        btn.style.display = 'none';
        sk46WireTranscriptBtn(btn, entry);
        btn.addEventListener('mousedown', (e) => e.stopPropagation());
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('contextmenu', (e) => e.stopPropagation());
        return btn;
    }

    function sk46WireTranscriptBtn(btn, entry) {
        let lastFire = 0;
        const fire = () => {
            if (performance.now() - lastFire < 400) return;
            lastFire = performance.now();
            
            const refreshing = sk46PopupEntry === entry
                && entry.status === 'done'
                && !!(entry.transcript || entry.translated);
            if (refreshing) {
                ;
                entry.transcript = null;
                entry.translated = null;
                entry.status = 'idle';
                entry.error = null;
                entry.translationError = null;
                sk46RunTranscription(entry, true);
                return;
            }
            ;
            
            sk46OpenPopup(entry, true);
if (entry.url || sk46FindAudioUrlFor(entry.el)) return;
              
            if (entry.transcript || entry.status === 'done') return;
            sk46ArmWaitForAudioUrl(entry);
            sk46TryActivatePlayForFetch(entry);
        };
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fire();
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.detail !== 0) return;
            fire();
        });
    }

    function sk46UpdateTranscriptBtnPosition(entry, rect, visible) {
        const btn = entry.transcriptEl;
        if (!btn) return;
        if (!visible || !rect) {
            if (btn.style.display !== 'none') btn.style.display = 'none';
            return;
        }
        const sz = sk46RefreshBtnSizePx;
        
        const anchor = entry.msgRect || rect;
        const left = anchor.right - sz - sk46RefreshBtnOffsetXPx;
        const top = rect.top + sk46RefreshBtnOffsetYPx;
        btn.style.left = left + 'px';
        btn.style.top = top + 'px';
        btn.style.width = sz + 'px';
        btn.style.height = sz + 'px';
        if (btn.style.display !== 'flex') btn.style.display = 'flex';
    }

    function sk46UpdateTranscriptBtnState(entry) {
        const btn = entry.transcriptEl;
        if (!btn) return;
        const hasResult = entry.status === 'done' && !!(entry.transcript || entry.translated);
        
        const waiting = !!entry.waitingForUrl && !entry.url && !hasResult;
        const busy = entry.status === 'transcribing' || entry.status === 'translating' || waiting;
        const popupOpen = sk46PopupEntry === entry;
        btn.classList.toggle('spinning', busy);
        
        const isRefresh = sk46TranscriptBtnIsRefresh(entry);
        btn.innerHTML = isRefresh ? SK46_ICON_REFRESH : SK46_ICON_TRANSCRIPT;
        btn.setAttribute('aria-label',
            busy ? (waiting && entry.waitingPhase !== 'manual' ? 'Getting the audio…' : 'Transcribing…')
                : (isRefresh ? 'Refresh transcript'
                    : (hasResult ? 'Show transcript' : 'Transcribe this audio')));
    }

    function sk46ResolveAudioUrlCached(entry) {
        
        if (entry.file) {
            
            const cachedBuf = sk46CachedBufferForFile(entry.file);
            if (cachedBuf) {
                sk46Trace('audio:source', { source: 'local-cache', file: entry.file, bytes: cachedBuf.byteLength });
                return { url: null, file: entry.file, buffer: cachedBuf };
            }
            sk46Trace('audio:source', { source: 'local-cache-miss', file: entry.file });
        }
        if (entry.url && (sk46IsUrlFresh(entry.url) || sk46MediaCachedFor(entry.url))) {
            sk46Trace('audio:source', { source: 'entry-url', file: entry.file, url: sk46TraceUrlInfo(entry.url) });
            return { url: entry.url, file: entry.file };
        }
        const fresh = entry.fileKey ? sk46FindFreshUrlForFile(entry.fileKey) : null;
        if (fresh) {
            sk46Trace('audio:source', { source: 'fresh-url-for-file', file: fresh.file, url: sk46TraceUrlInfo(fresh.url) });
            sk46BindAudioUrl(entry, fresh.url, fresh.file);
            return { url: fresh.url, file: fresh.file };
        }
        
        if (sk46ExpectedPlaybackFor() === entry) {
            const known = sk46FindFreshUrlForAnchor(entry.anchorKey);
            if (known) {
                sk46Trace('audio:source', { source: 'just-played-recorded-url', file: known.file, url: sk46TraceUrlInfo(known.url) });
                sk46BindAudioUrl(entry, known.url, known.file);
                return { url: known.url, file: known.file };
            }
            sk46Trace('audio:source', { source: 'just-played-no-url-yet', anchor: entry.anchorKey });
        }
        return null;
    }

    function sk46AcceptAudioSrc(entry, src, sourceEl) {
        if (!src || !SK46_MEDIA_PATH_RE.test(src)) return null;
        const file = sk46AudioFileFromUrl(src);
        if (!file) return null;
        if (entry.file && file !== entry.file) {
            sk46Trace('src:rejected', { reason: 'other-voice-message', srcFile: file, expectedFile: entry.file });
            ;
            return null;
        }
        if (!sk46IsUrlFresh(src)) {
            sk46Trace('src:rejected', { reason: 'expired', srcFile: file, url: sk46TraceUrlInfo(src) });
            ;
            return null;
        }
        if (!entry.file && !sk46MediaElIsActive(sourceEl)) {
            
            sk46Trace('src:rejected', { reason: 'stale-media-element', srcFile: file });
            return null;
        }
        sk46Trace('src:accepted', { srcFile: file, url: sk46TraceUrlInfo(src) });
        return { url: src, file };
    }

    function sk46BoundAudioUrl(entry) {
        if (entry.url && sk46IsUrlFresh(entry.url)) {
            return { url: entry.url, file: entry.file };
        }
        const rec = entry.el ? sk46FindAudioUrlFor(entry.el) : null;
        if (rec && rec.url && sk46IsUrlFresh(rec.url)) {
            return { url: rec.url, file: rec.file || entry.file };
        }
        if (entry.fileKey) {
            const fresh = sk46FindFreshUrlForFile(entry.fileKey);
            if (fresh) return { url: fresh.url, file: fresh.file };
        }
        return null;
    }

    function sk46ResolveAudioUrl(entry) {
        
        const immediate = sk46ResolveAudioUrlCached(entry);
        if (immediate) return Promise.resolve(immediate);
        
        return new Promise((resolve, reject) => {
            
            const peek = () => {
                const bound = sk46BoundAudioUrl(entry);
                if (bound) return bound;
                const seen = sk46PeekMediaUrlFromElement(entry.el);
                return seen ? sk46AcceptAudioSrc(entry, seen.src, seen.el) : null;
            };
            const pre = peek();
            if (pre) { sk46MaybeHaltPlayback(entry, 'url resolved immediately'); resolve(pre); return; }

            const prevHook = sk46MediaUrlOnSrc;
            let settled = false;
            const cleanup = () => {
                sk46MediaUrlOnSrc = prevHook;
                clearInterval(pollTimer);
                clearTimeout(hardTimer);
                if (settled) return;
                settled = true;
                
                const late = peek();
                if (late) {
                    sk46Trace('url:recovered-at-timeout', {
                        file: late.file, url: sk46TraceUrlInfo(late.url), anchor: entry.anchorKey,
                    });
                    ;
                    sk46MaybeHaltPlayback(entry, 'recovered at timeout');
                    resolve(late);
                    return;
                }
                sk46Trace('url:timeout', { anchor: entry.anchorKey, entryFile: entry.file || null });
                reject(new Error('Audio URL unavailable. Press play until the icon turns into pause, then reopen.'));
            };
            const onSrc = (url, sourceEl) => {
                if (settled) return;
                const hit = sk46AcceptAudioSrc(entry, url, sourceEl);
                if (!hit) return;
                settled = true;
                cleanup();
                sk46MaybeHaltPlayback(entry, 'src hook');
                resolve(hit);
            };
            sk46MediaUrlOnSrc = onSrc;
            const pollTimer = setInterval(() => {
                const hit = peek();
                if (!hit || settled) return;
                settled = true;
                cleanup();
                sk46MaybeHaltPlayback(entry, 'poll tick');
                resolve(hit);
            }, 300);
            
            const hardTimer = setTimeout(cleanup, 30000);
            ;
        });
    }

    let sk46MediaUrlOnSrc = null;

    function sk46TranscriptFingerprint() {
        return sk46HashStr([
            String(sk46EffectiveAudioModel() || ''),
        ].join('\u0000'));
    }

    function sk46TranscriptKey(file) {
        return sk46HashStr(String(file || '') + '\u0001' + sk46TranscriptFingerprint());
    }

    const sk46TranscriptCache = new Map();

    function sk46LoadTranscriptStore() {
        let raw;
        try { raw = sk46GmGet(SK46_TRANSCRIPT_STORE_KEY, null); } catch { return 0; }
        if (!raw) return 0;
        let obj;
        try { obj = (typeof raw === 'string') ? JSON.parse(raw) : raw; } catch { return 0; }
        if (!obj || typeof obj !== 'object') return 0;
        let n = 0;
        for (const [k, v] of Object.entries(obj)) {
if (!v || typeof v !== 'object' || !v.tr) continue;
    let words = null;
    if (Array.isArray(v.w) && v.w.length) {
    words = [];
    for (const x of v.w) {
    if (Array.isArray(x) && x.length >= 3) {
    const s = Number(x[1]);
    if (Number.isFinite(s)) words.push({ w: String(x[0]), s, e: Number(x[2]) || s + 0.12 });
    }
    }
    }
    sk46TranscriptCache.set(k, {
    transcript: String(v.tr || ''),
    translated: v.tl ? String(v.tl) : null,
    words,
    contexts: sk46DecodeStoredContexts(v.cx, v.cw),
    
    fp: typeof v.fp === 'string' ? v.fp : null,
    ts: Number(v.ts) || Date.now(),
    });
    n++;
        }
        return n;
    }

    function sk46DecodeStoredContexts(cx, cw) {
        if (!Array.isArray(cx) || !cx.length) return null;
        const out = [];
        for (let i = 0; i < cx.length; i++) {
            const c = cx[i];
            if (!Array.isArray(c) || c.length < 3) continue;
            const src = Array.isArray(cw) && Array.isArray(cw[i]) ? cw[i] : null;
            const words = [];
            if (src) {
                for (const x of src) {
                    if (!Array.isArray(x) || x.length < 3) continue;
                    const s = Number(x[1]);
                    if (Number.isFinite(s)) words.push({ w: String(x[0]), s, e: Number(x[2]) || s + 0.12 });
                }
            }
            out.push({
                id: Number(c[0]) || i,
                source: String(c[1] || ''),
                translated: String(c[2] || ''),
                start: Number(c[3]) || 0,
                end: Number(c[4]) || 0,
                words: words.length ? words : null,
            });
        }
        return out.length ? out : null;
    }

    function sk46PersistTranscriptsNow() {
        const SK46_TRANSCRIPT_STORE_MAX = 500;
        try {
            const out = {};
            const rows = [];
            for (const [k, v] of sk46TranscriptCache) rows.push([k, v]);
            rows.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
            for (const [k, v] of rows.slice(0, SK46_TRANSCRIPT_STORE_MAX)) {
                
    out[k] = {
      tr: v.transcript,
      tl: v.translated || '',
      
      fp: v.fp || null,
      ts: v.ts,
      w: v.words && v.words.length ? v.words.map(x => [x.w, x.s, x.e]) : null,
      
      cx: v.contexts && v.contexts.length ? v.contexts.map(c => [
        c.id, c.source || '', c.translated || '',
        Number(c.start) || 0, Number(c.end) || 0,
      ]) : null,
      cw: v.contexts && v.contexts.length
        ? v.contexts.map(c => (c.words || []).map(x => [x.w, x.s, x.e]))
        : null,
    };
            }
            sk46GmSet(SK46_TRANSCRIPT_STORE_KEY, JSON.stringify(out));
        } catch (e) {
            ;
        }
    }

    function sk46RememberTranscript(entry) {
        if (!entry.file || !entry.transcript) return;
        const key = sk46TranscriptKey(entry.file);
sk46TranscriptCache.set(key, {
        transcript: entry.transcript,
translated: entry.translated || null,
        
        words: entry.words && entry.words.length ? entry.words : null,
        
        contexts: entry.contexts && entry.contexts.length ? entry.contexts : null,
        
        fp: entry.translated ? sk46TranslationFingerprint() : null,
        ts: Date.now(),
        });
    sk46PersistTranscriptsNow();
        ;
    }

    function sk46RecallTranscript(entry) {
        if (!entry.file) return null;
        const hit = sk46TranscriptCache.get(sk46TranscriptKey(entry.file));
        if (!hit || !hit.transcript) return null;
        const currentFp = sk46TranslationFingerprint();
        const translationFresh = !!(hit.translated && hit.fp && hit.fp === currentFp);
        return {
            transcript: hit.transcript,
            words: hit.words || null,
            translated: translationFresh ? hit.translated : null,
            contexts: translationFresh ? (hit.contexts || null) : null,
            translationFresh,
            hasStoredTranslation: !!hit.translated,
            storedFp: hit.fp || null,
        };
    }

    async function sk46TranslateEntry(entry, file) {
        const transcript = entry.transcript;
        entry.status = 'translating';
        sk46UpdateTranscriptBtnState(entry);
        sk46RenderPopup(entry);
        try {
            const tTr = performance.now();
            const res = await sk46TranslateTranscript(transcript, entry.words);
            entry.translated = res.translated;
            entry.contexts = res.contexts;
            sk46Trace('translate:done', {
                file: file || null,
                contexts: res.contexts.length,
                segments: res.segments ? res.segments.length : null,
                translatedChars: String(res.translated || '').length,
                elapsedMs: Math.round(performance.now() - tTr),
            });
            if (entry.words && entry.words.length) {
                ;
            }
        } catch (e) {
            entry.translated = null;
            entry.contexts = null;
            entry.translationError = String(e && e.message || e);
            sk46Trace('translate:failed', { file: file || null, error: entry.translationError });
            ;
        }
        entry.status = 'done';
        entry.error = null;
        sk46RememberTranscript(entry);
    }

    async function sk46RunTranscription(entry, force) {
        if (entry.status === 'transcribing' || entry.status === 'translating') return;
        sk46TraceRun++;
        const member = sk46AudioGroupId();
        sk46Trace('run:start', {
            member: member || '(unknown)',
            anchor: entry.anchorKey,
            knownFile: entry.file || null,
            knownUrl: sk46TraceUrlInfo(entry.url),
            force: !!force,
            statusBefore: entry.status,
        });
        
        sk46ClearWaitingForUrl(entry);
        
        if (entry.file && !force) {
            const hit = sk46RecallTranscript(entry);
            if (hit) {
                
                entry.transcript = hit.transcript;
                entry.words = hit.words || null;
                entry.contexts = null;
                entry.translated = null;
                if (hit.translationFresh) {
                    
                    entry.translated = hit.translated || null;
                    entry.contexts = hit.contexts || null;
                    entry.status = 'done';
                    entry.error = null;
                    entry.translationError = hit.translated ? null : 'Translation not saved';
                    ;
                    sk46Trace('cache:hit', {
                        file: entry.file,
                        transcriptChars: String(hit.transcript || '').length,
                        hasTranslation: !!hit.translated,
                        hasWords: !!(hit.words && hit.words.length),
                        contexts: hit.contexts ? hit.contexts.length : 0,
                    });
                    sk46UpdateTranscriptBtnState(entry);
                    sk46RenderPopup(entry);
                    return;
                }
                
                sk46Trace('cache:partial', {
                    file: entry.file,
                    reason: 'translation stale for current settings',
                    hasWords: !!(hit.words && hit.words.length),
                });
                ;
                sk46ClearWaitingForUrl(entry);
                sk46UpdateTranscriptBtnState(entry);
                sk46RenderPopup(entry);
                await sk46TranslateEntry(entry, entry.file);
                sk46Trace('run:done', {
                    file: entry.file,
                    transcriptChars: String(entry.transcript || '').length,
                    translatedChars: String(entry.translated || '').length,
                    totalMs: 0,
                    noStt: true,
                });
                sk46UpdateTranscriptBtnState(entry);
                sk46RenderPopup(entry);
                return;
            }
            sk46Trace('cache:miss', { file: entry.file });
        }
        entry.status = 'transcribing';
        entry.error = null;
        entry.translated = null;
        entry.translationError = null;
        sk46UpdateTranscriptBtnState(entry);
        sk46RenderPopup(entry);
        const tRun = performance.now();
        try {
            const { url, file, buffer } = await sk46ResolveAudioUrl(entry);
            sk46Trace('audio:resolved', {
                file: file || null,
                fromUrl: sk46TraceUrlInfo(url),
                usedLocalBytes: !url && !!buffer,
                bytes: buffer ? buffer.byteLength : null,
                elapsedMs: Math.round(performance.now() - tRun),
            });
            
            if (entry.file && file && entry.file !== file) {
                sk46Trace('audio:FILE-MISMATCH', {
                    entryFile: entry.file,
                    resolvedFile: file,
                    anchor: entry.anchorKey,
                    member,
                });
                ;
            }
            if (url && (entry.url !== url || entry.file !== file)) sk46BindAudioUrl(entry, url, file);
            const tStt = performance.now();
            const stt = await sk46TranscribeAudio(url, file, buffer);
            const transcript = typeof stt === 'string' ? stt : stt.text;
            entry.words = (typeof stt === 'object' && stt.words) || null;
            sk46Trace('stt:done', {
                file: file || null,
                chars: String(transcript || '').length,
                words: entry.words ? entry.words.length : 0,
                elapsedMs: Math.round(performance.now() - tStt),
            });
            if (entry.words && entry.words.length) {
                ;
            }
            entry.transcript = transcript;
            entry.contexts = null;
            entry.translated = null;
            entry.translationError = null;
            await sk46TranslateEntry(entry, file);
            sk46Trace('run:done', {
                file: file || null,
                transcriptChars: String(transcript || '').length,
                translatedChars: String(entry.translated || '').length,
                totalMs: Math.round(performance.now() - tRun),
            });
            ;
        } catch (e) {
            entry.status = 'error';
            entry.error = String(e && e.message || e);
            sk46Trace('run:failed', { file: entry.file || null, error: entry.error });
            ;
        }
        sk46ClearWaitingForUrl(entry);
        sk46UpdateTranscriptBtnState(entry);
        sk46RenderPopup(entry);
    }

function sk46RoundedRectPath(x, y, w, h, r) {
        const rr = Math.max(0, Math.min(r, w / 2, h / 2));
        if (rr <= 0) return `M${x},${y} h${w} v${h} h${-w} Z`;
        return `M${x + rr},${y} h${w - 2 * rr} a${rr},${rr} 0 0 1 ${rr},${rr} `
            + `v${h - 2 * rr} a${rr},${rr} 0 0 1 ${-rr},${rr} `
            + `h${-(w - 2 * rr)} a${rr},${rr} 0 0 1 ${-rr},${-rr} `
            + `v${-(h - 2 * rr)} a${rr},${rr} 0 0 1 ${rr},${-rr} Z`;
    }

    function sk46CirclePath(cx, cy, r) {
        if (!(r > 0)) return '';
        return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`;
    }

    function sk46TranscriptBtnIsRefresh(entry) {
        if (!entry) return false;
        const hasResult = entry.status === 'done' && !!(entry.transcript || entry.translated);
        const waiting = !!entry.waitingForUrl && !entry.url && !hasResult;
        const busy = entry.status === 'transcribing' || entry.status === 'translating' || waiting;
        return busy || (hasResult && sk46PopupEntry === entry);
    }

    function sk46UpdatePopupBackdrop() {
        const SK46_POPUP_RADIUS_PX = 12;
        const SK46_BUBBLE_RADIUS_PX = 4;
        if (!sk46PopupEntry) {
            sk46PopupBackdrop.classList.remove('visible');
            sk46PopupBackdrop.style.maskImage = '';
            sk46PopupBackdrop.style.webkitMaskImage = '';
            return;
        }
        
        const appRect = sk46GetAppViewportRect();
        
        if (appRect && appRect.width > 0 && appRect.height > 0) {
            sk46PopupBackdrop.style.inset = '';
            sk46PopupBackdrop.style.left = appRect.left + 'px';
            sk46PopupBackdrop.style.right = (window.innerWidth - appRect.right) + 'px';
            sk46PopupBackdrop.style.top = appRect.top + 'px';
            sk46PopupBackdrop.style.bottom = (window.innerHeight - appRect.bottom) + 'px';
            sk46PopupBackdrop.style.width = '';
            sk46PopupBackdrop.style.height = '';
        } else {
            sk46PopupBackdrop.style.inset = '0';
            sk46PopupBackdrop.style.left = '';
            sk46PopupBackdrop.style.right = '';
            sk46PopupBackdrop.style.top = '';
            sk46PopupBackdrop.style.bottom = '';
            sk46PopupBackdrop.style.width = '';
            sk46PopupBackdrop.style.height = '';
        }
        
        sk46PopupBackdrop.classList.add('visible');
        const box = sk46PopupBackdrop.getBoundingClientRect();
        const appLeft = box.width > 0 ? box.left : (appRect ? appRect.left : 0);
        const appTop = box.height > 0 ? box.top : (appRect ? appRect.top : 0);
        const appW = box.width > 0 ? box.width : (appRect ? appRect.width : window.innerWidth);
        const appH = box.height > 0 ? box.height : (appRect ? appRect.height : window.innerHeight);

        const bleed = 2;
        let path = `M${appLeft - bleed},${appTop - bleed} H${appLeft + appW + bleed} V${appTop + appH + bleed} H${appLeft - bleed} Z`;
        const cr = sk46PopupCard.getBoundingClientRect();
        if (cr.width > 0 && cr.height > 0) {
            path += ' ' + sk46RoundedRectPath(cr.left, cr.top, cr.width, cr.height, SK46_POPUP_RADIUS_PX);
        }
        if (sk46PopupEntry) {
            const br = sk46EntryRect(sk46PopupEntry);
            if (br && br.width > 0 && br.height > 0) {
                path += ' ' + sk46RoundedRectPath(br.left, br.top, br.width, br.height, SK46_BUBBLE_RADIUS_PX);
            }
            
            if (sk46TranscriptBtnIsRefresh(sk46PopupEntry)) {
                const btn = sk46PopupEntry.transcriptEl;
                if (btn && btn.style.display !== 'none' && btn.isConnected) {
                    const tr = btn.getBoundingClientRect();
                    if (tr.width > 0 && tr.height > 0) {
                        const cx = tr.left + tr.width / 2;
                        const cy = tr.top + tr.height / 2;
                        const rad = tr.width / 2 + 1;
                        path += ' ' + sk46CirclePath(cx, cy, rad);
                    }
                }
            }
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${appLeft} ${appTop} ${appW} ${appH}">`
            + `<path d="${path}" fill="white" fill-rule="evenodd"/></svg>`;
        const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        
        sk46PopupBackdrop.style.maskImage = uri;
        sk46PopupBackdrop.style.webkitMaskImage = uri;
        sk46PopupBackdrop.style.maskSize = '100% 100%';
        sk46PopupBackdrop.style.webkitMaskSize = '100% 100%';
        sk46PopupBackdrop.style.maskRepeat = 'no-repeat';
        sk46PopupBackdrop.style.webkitMaskRepeat = 'no-repeat';
        sk46PopupBackdrop.style.maskPosition = '0 0';
        sk46PopupBackdrop.style.webkitMaskPosition = '0 0';
    }

    function sk46ClosePopup() {
        const prev = sk46PopupEntry;
        sk46StopKaraokeLoop();
        sk46PopupEntry = null;
        sk46HidePopupChrome();
        sk46PopupBackdrop.style.maskImage = '';
        sk46PopupBackdrop.style.webkitMaskImage = '';
        
        if (prev && prev.transcriptEl) sk46UpdateTranscriptBtnState(prev);
        
        sk46PopupTabPinned = false;
        ;
    }

function sk46AudioIsPlaying() {
        const el = sk46LastMediaEl;
        if (!el) return false;
        try { return el.paused === false && !el.ended && el.readyState > 0; }
        catch { return false; }
    }

    let sk46KaraokeActive = null;
    let sk46KaraokeRafId = 0;

    function sk46CurrentMediaTime() {
        try {
            const el = sk46LastMediaEl;
            if (!el) return 0;
            const t = Number(el.currentTime);
            return Number.isFinite(t) && t > 0 ? t : 0;
        } catch { return 0; }
    }

    function sk46SyncKaraoke() {
        const body = sk46PopupBody;
        if (!body) return false;
        const wants = sk46AudioIsPlaying() && !!body.__sk46Spans && !!sk46PopupEntry;
        if (!wants) {
            
                        return false;
        }
        if (!body.classList.contains('karaoke')) {
            
            if (body.__sk46AllRead && body.__sk46Spans) {
            for (const sp of body.__sk46Spans) { sp.past = false; sp.el.classList.remove('past'); }
            body.__sk46AllRead = false;
            }
            body.classList.add('karaoke');
            sk46PaintKaraoke(sk46CurrentMediaTime());
            return true;
        }
        sk46PaintKaraoke(sk46CurrentMediaTime());
        return true;
    }

    function sk46EnsureKaraokeLoop() {
        if (sk46KaraokeRafId) return;
        const tick = () => {
            sk46KaraokeRafId = 0;
            const active = sk46SyncKaraoke();
            if (active) sk46KaraokeRafId = requestAnimationFrame(tick);
        };
        sk46KaraokeRafId = requestAnimationFrame(tick);
    }

    function sk46StopKaraokeLoop() {
        if (!sk46KaraokeRafId) return;
        cancelAnimationFrame(sk46KaraokeRafId);
        sk46KaraokeRafId = 0;
        const body = sk46PopupBody;
        if (body && body.__sk46Text != null) body.textContent = body.__sk46Text;
        if (body) {
            body.classList.remove('karaoke');
        body.__sk46Spans = null;
        body.__sk46AllRead = false;
        }
        sk46KaraokeActive = null;
    }

function sk46AnchorTokens(text) {
        const s = String(text || '');
        const out = new Set();
        for (const m of s.matchAll(/\d+(?:[.,:]\d+)*/g)) out.add('#' + m[0].replace(/[.,]/g, ''));
        for (const m of s.matchAll(/[A-Za-z][A-Za-z'\-]{2,}/g)) {
        const w = m[0].toLowerCase();
        
        if (SK46_STOPWORDS.has(w)) continue;
        out.add(w);
        }
        return out;
    }

    const SK46_STOPWORDS = new Set(['the', 'and', 'for', 'you', 'are', 'was', 'but', 'not', 'with', 'this', 'that', 'have', 'has', 'had', 'from', 'they', 'will', 'would', 'there', 'their', 'what', 'when', 'where', 'which', 'about', 'into', 'than', 'then', 'them', 'these', 'those', 'been', 'being', 'does', 'did', 'can', 'could', 'should', 'because', 'while']);

    function sk46PauseThreshold(words) {
        if (!Array.isArray(words) || words.length < 2) return Infinity;
        const gaps = [];
        for (let i = 0; i < words.length - 1; i++) gaps.push(words[i + 1].s - words[i].e);
        if (!gaps.length) return Infinity;
        const sorted = [...gaps].sort((a, b) => a - b);
        
        const n = Math.max(1, Math.ceil(sorted.length / 2));
        let sum = 0;
        for (let i = 0; i < n; i++) sum += sorted[i];
        const breath = sum / n;
        
        return Math.max(0.35, breath * 6);
    }

    function sk46FindPauseCut(words, from, until, threshold, ideal) {
        if (!Array.isArray(words)) return null;
        let best = null, bestDist = Infinity;
        for (let i = Math.max(0, from); i < until; i++) {
            if (i + 1 >= words.length) break;
            const gap = words[i + 1].s - words[i].e;
            if (gap < threshold) continue;
            
            const dist = typeof ideal === 'number' ? Math.abs(i + 1 - ideal) : 0;
            if (dist < bestDist) { bestDist = dist; best = i + 1; }
        }
        return best;
    }

    function sk46WordCharIndex(words) {
        const idx = new Array(words.length);
        let acc = 0;
        for (let i = 0; i < words.length; i++) {
            idx[i] = acc;
            acc += sk46NormalizedWordLength(words[i].w);
        }
        return { idx, total: acc };
    }

    function sk46NormalizedWordLength(w) {
        return String(w || '').replace(/[^\p{L}\p{N}]/gu, '').length;
    }

    function sk46BuildSemanticUnits(transcript, words) {
        const text = String(transcript || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (!text) return [];
        if (!words || !words.length) {
            
            const raw = text
                .split(/(?<=[.!?\u3002\uff01\uff1f\u2026])\s*/u)
                .map(s => s.trim())
                .filter(s => /[\p{L}\p{N}]/u.test(s));
            const list = raw.length ? raw : [text];
            return list.map((t, i) => ({ id: i, text: t }));
        }
        const { idx, total } = sk46WordCharIndex(words);
        if (!total) return [{ id: 0, text }];

        const normAt = new Array(text.length + 1);
        let n = 0;
        for (let i = 0; i < text.length; i++) {
            normAt[i] = n;
            if (/[\p{L}\p{N}]/u.test(text[i])) n++;
        }
        normAt[text.length] = n;

        const cutWords = [];
        let sawTerminal = false;
        for (let i = 0; i < text.length; i++) {
            if (/[.!?\u3002\uff01\uff1f\u2026]/u.test(text[i])) { sawTerminal = true; cutWords.push(normAt[i + 1]); }
        }
        const wordCuts = sawTerminal
            ? cutWords.map(pos => sk46CharToWord(pos, normAt[text.length], idx))
            : sk46PauseWordCuts(words);
        wordCuts.sort((a, b) => a - b);

        const units = [];
        let startWord = 0;
        const pushUnit = (endWord) => {
            if (endWord <= startWord) return;
            const t = words.slice(startWord, endWord).map(w => w.w).join(' ').trim();
            if (t) units.push({
                id: units.length,
                text: t,
                wStart: startWord,
                wEnd: endWord,
                start: words[startWord].s,
                end: words[endWord - 1].e,
            });
            startWord = endWord;
        };
        for (const cw of wordCuts) {
            if (cw > startWord && cw < words.length) pushUnit(cw);
        }
        pushUnit(words.length);
        
        if (!units.length) {
            units.push({
                id: 0,
                text: words.map(w => w.w).join(' ').trim() || text,
                wStart: 0, wEnd: words.length,
                start: words[0].s, end: words[words.length - 1].e,
            });
        }
        units.forEach((u, i) => { u.id = i; });
        return units;
    }

    function sk46CharToWord(normPos, normLen, idx) {
        const c = Math.min(Number(normLen) || 0, Math.max(0, normPos));
        let lo = 0, hi = idx.length - 1, ans = 0;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (idx[mid] <= c) { ans = mid; lo = mid + 1; } else hi = mid - 1;
        }
        return ans;
    }

    function sk46PauseWordCuts(words) {
        const threshold = sk46PauseThreshold(words);
        const out = [];
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i + 1].s - words[i].e >= threshold) out.push(i + 1);
        }
        return out;
    }

    function sk46BuildContextPrompt(units) {
        const sources = units.map(u => u.text);
        const { parts, targetLanguage } = sk46BuildStylePromptParts(sources, { suppressNickname: true });
        parts.push('');
        parts.push(`Input (${units.length} numbered spoken context${units.length > 1 ? 's' : ''}, in order, from one voice message):`);
        for (let i = 0; i < units.length; i++) {
            parts.push(`[${i + 1}] ${units[i].text}`);
        }
        parts.push('');
        parts.push(`Output (${units.length} numbered translations, one per input):`);
        parts.push('- Each numbered context is one complete spoken thought. Translate it fully and naturally, preserving all meaning, names, qualifiers, and discourse markers.');
        parts.push('- Keep every context on ONE physical line. Never merge, split, reorder, drop, or invent a context.');
        parts.push('- Preserve the [N] tag exactly and keep the same count and order. Output nothing else.');
        parts.push('- Keep numerals, dates, counts, and measurements as digits exactly as spoken.');
        parts.push(`- Each line must read as natural ${targetLanguage}, not as a literal translation.`);
        return parts.join('\n');
    }

    function sk46ParseContextResponse(raw, n) {
        const cleaned = String(raw || '').replace(/```[a-z]*\s*/gi, '').replace(/```\s*/g, '').trim();
        const rawLines = cleaned.split('\n');
        const byId = new Map();
        for (const line of rawLines) {
            const m = line.match(/^\s*\[(\d+)\]\s*(.*)$/);
            if (!m) continue;
            const id = parseInt(m[1], 10);
            if (id < 1 || id > n) continue;
            if (byId.has(id)) continue;
            byId.set(id, sk46DecodeLineBreaks(m[2].trim()));
        }
        if (byId.size < Math.min(2, n)) {
            
            const nonEmpty = rawLines
                .map(l => l.replace(/^\s*\[\d+\]\s*/, '').trim())
                .filter(Boolean);
            if (nonEmpty.length === n) return nonEmpty.map(sk46DecodeLineBreaks);
            if (nonEmpty.length >= Math.floor(n * 0.6)) {
                const out = nonEmpty.slice(0, n).map(sk46DecodeLineBreaks);
                while (out.length < n) out.push('');
                return out;
            }
            return null;
        }
        const out = [];
        for (let i = 1; i <= n; i++) out.push(byId.has(i) ? byId.get(i) : '');
        return out;
    }

    const SK46_SEGMENT_MIN_SECONDS = 0.05;
    
    function sk46BuildContextSegments(contexts) {
        if (!contexts || !contexts.length) return null;
        const out = [];
        for (let ci = 0; ci < contexts.length; ci++) {
            const ctx = contexts[ci];
            const text = String(ctx.translated || '').trim();
            if (!text) continue;
            const parts = sk46SplitDisplaySegments(text);
            if (!parts.length) continue;
            const texts = parts.map(p => p.t);
            const words = Array.isArray(ctx.words) ? ctx.words : [];
            if (!words.length) {
                
                const unitStart = Number(ctx.start) || 0;
                const unitEnd = Number(ctx.end) || unitStart + 0.2;
                const span = Math.max(0.2, unitEnd - unitStart);
                const weights = sk46SegmentWeights(texts);
                let acc = 0;
                for (let i = 0; i < texts.length; i++) {
                    const s = unitStart + Math.round(span * acc);
                    acc += weights[i];
                    const e = i === texts.length - 1
                        ? unitEnd
                        : unitStart + Math.round(span * acc);
                    out.push({ t: texts[i], sp: parts[i].sp, s, e: Math.max(e, s + SK46_SEGMENT_MIN_SECONDS) });
                }
                continue;
            }
            const lens = texts.map(t => t.replace(/[^\p{L}\p{N}]/gu, '').length || 1);
            const totalLen = lens.reduce((a, b) => a + b, 0) || 1;
            const n = words.length;
            const cuts = [0];
            let accLen = 0;
            for (let i = 0; i < texts.length - 1; i++) {
                accLen += lens[i];
                const ideal = Math.round((accLen / totalLen) * n);
                const lower = cuts[cuts.length - 1] + 1;
                const upper = n - (texts.length - 1 - i);
                cuts.push(Math.max(lower, Math.min(upper, ideal)));
            }
            cuts.push(n);
            for (let i = 0; i < texts.length; i++) {
                const from = cuts[i];
                const to = cuts[i + 1];
                const s = words[from] ? words[from].s : (Number(ctx.start) || 0);
                const e = words[to - 1] ? words[to - 1].e : s;
                out.push({ t: texts[i], sp: parts[i].sp, s, e: Math.max(e, s + SK46_SEGMENT_MIN_SECONDS) });
            }
        }
        for (let i = 1; i < out.length; i++) {
            if (out[i].s < out[i - 1].e) out[i].s = out[i - 1].e;
            if (out[i].e <= out[i].s) out[i].e = out[i].s + SK46_SEGMENT_MIN_SECONDS;
        }
        return out.length ? out : null;
    }

    function sk46SplitDisplaySegments(text) {
        const MAX_SEGMENT_CHARS = 80;
        const raw = String(text || '');
        const cjk = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(raw);
        const sep = cjk ? '' : ' ';

        const sentences = [];
        let start = 0;
        for (let i = 0; i < raw.length; i++) {
            if (!SK46_SENTENCE_END_RE.test(raw[i])) continue;
            let j = i;
            while (j + 1 < raw.length && (SK46_SENTENCE_END_RE.test(raw[j + 1]) || SK46_CLOSING_RE.test(raw[j + 1]))) j++;
            const chunk = raw.slice(start, j + 1).trim();
            if (chunk) sentences.push(chunk);
            start = j + 1;
            i = j;
        }
        const tail = raw.slice(start).trim();
        if (tail) sentences.push(tail);

        const out = [];
        for (const sentence of sentences) {
            if (sentence.length <= MAX_SEGMENT_CHARS) {
                out.push({ t: sentence, sp: sep });
                continue;
            }
            
            const clauses = sk46SplitAfterPunct(sentence, SK46_CLAUSE_RE);
            if (clauses.length > 1) {
                for (const packed of sk46PackClauses(clauses, MAX_SEGMENT_CHARS)) {
                    out.push({ t: packed, sp: sep });
                }
                continue;
            }
            
            const pieces = sk46SplitAtWhitespace(sentence, MAX_SEGMENT_CHARS, cjk);
            for (const piece of pieces) out.push({ t: piece, sp: sep });
        }
        return out.filter(s => /[\p{L}\p{N}]/u.test(s.t));
    }

    const SK46_SENTENCE_END_RE = /[.!?\u3002\uff01\uff1f\u2026]/u;
    const SK46_CLAUSE_RE = /[,\u3001\uff0c;\uff1b:\uff1a\u3002]/u;
    const SK46_CLOSING_RE = /["'\)\]\u300d\u300f\uff09\u201d\u2019]/u;

    function sk46SplitAfterPunct(text, re) {
        const out = [];
        let start = 0;
        for (let i = 0; i < text.length; i++) {
            if (!re.test(text[i])) continue;
            let j = i;
            while (j + 1 < text.length && (re.test(text[j + 1]) || SK46_CLOSING_RE.test(text[j + 1]))) j++;
            const chunk = text.slice(start, j + 1).trim();
            if (chunk) out.push(chunk);
            start = j + 1;
            i = j;
        }
        const tail = text.slice(start).trim();
        if (tail) out.push(tail);
        return out;
    }

    function sk46PackClauses(clauses, maxChars) {
        const out = [];
        let cur = '';
        for (const c of clauses) {
            if (!cur) { cur = c; continue; }
            if (cur.length + c.length + 1 <= maxChars) { cur = (cur + ' ' + c).trim(); continue; }
            out.push(cur);
            cur = c;
        }
        if (cur) out.push(cur);
        return out;
    }

    function sk46SplitAtWhitespace(text, maxChars, cjk) {
        if (cjk) return [text];
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length < 2) return [text];
        const pieces = Math.max(2, Math.ceil(text.length / maxChars));
        const size = Math.ceil(words.length / pieces);
        const out = [];
        for (let i = 0; i < words.length; i += size) {
            const piece = words.slice(i, i + size).join(' ');
            if (/[\p{L}\p{N}]/u.test(piece)) out.push(piece);
        }
        return out;
    }

    function sk46SegmentWeights(parts) {
        const lens = parts.map(p => {
        
        const bare = p.replace(/[^\p{L}\p{N}]/gu, '');
        return Math.max(1, bare.length);
        });
        const total = lens.reduce((a, b) => a + b, 0) || 1;
        return lens.map(l => l / total);
    }

    function sk46BuildTranslationSegments(translated, words) {
        if (!translated || !words || !words.length) return null;
        
        const raw = String(translated)
        .split(/(?<=[.!?。！？…])|(?<=[,;:、，；：])\s*/)
        .map(s => s.trim())
        .filter(s => /[\p{L}\p{N}]/u.test(s));
        if (!raw.length) return null;
        
        const MAX_WORDS_PER_SEGMENT = 16;
        const parts = [];
        for (const chunk of raw) {
        const ws = chunk.split(/\s+/).filter(Boolean);
        if (ws.length <= MAX_WORDS_PER_SEGMENT) { parts.push(chunk); continue; }
        for (let i = 0; i < ws.length; i += MAX_WORDS_PER_SEGMENT) {
        parts.push(ws.slice(i, i + MAX_WORDS_PER_SEGMENT).join(' '));
        }
        }
        if (!parts.length) return null;

        const total = words.length;

        const buckets = [[]];
        for (let i = 0; i < total; i++) {
        if (i > 0) {
        const prev = String(words[i - 1].w || '');
        
        if (/[.!?。！？…]$/.test(prev)) buckets.push([]);
        }
        buckets[buckets.length - 1].push(words[i]);
        }
        while (buckets.length > parts.length) {
        
        let k = 0;
        for (let i = 1; i < buckets.length; i++) if (buckets[i].length < buckets[k].length) k = i;
        if (k === 0) { buckets[1] = buckets[0].concat(buckets[1]); buckets.shift(); }
        else { buckets[k - 1] = buckets[k - 1].concat(buckets[k]); buckets.splice(k, 1); }
        }
        
        while (buckets.length < parts.length) {
        let k = 0;
        for (let i = 1; i < buckets.length; i++) if (buckets[i].length > buckets[k].length) k = i;
        if (buckets[k].length < 2) break;
        const mid = Math.ceil(buckets[k].length / 2);
        const head = buckets[k].slice(0, mid);
        const tail = buckets[k].slice(mid);
        buckets.splice(k, 1, head, tail);
        }
        const bucketAnchors = buckets.map(b =>
        sk46AnchorTokens(b.map(w => w.w).join(' ')));
        const bucketStarts = [];
        let acc = 0;
        for (const b of buckets) { bucketStarts.push(acc); acc += b.length; }

        const anchorWordAt = new Array(parts.length).fill(-1);
        const weights = sk46SegmentWeights(parts);
        const threshold = sk46PauseThreshold(words);
        const out = [];
        let cursor = 0;

        for (let i = 0; i < parts.length; i++) {
            const isLast = (i === parts.length - 1);
            const remaining = parts.length - 1 - i;
            const limit = total - remaining;
            let to;
            if (isLast) {
                to = total;
            } else {
                const pauseCut = sk46FindPauseCut(
                    words, cursor, limit, threshold,
                    cursor + Math.max(1, Math.round(weights[i] * total)));
                if (pauseCut != null) {
                    to = pauseCut;
                } else {
                    to = cursor + Math.max(1, Math.round(weights[i] * total));
                    
                    for (let j = i + 1; j < parts.length; j++) {
                        if (anchorWordAt[j] < 0) continue;
                        if (anchorWordAt[j] > cursor && anchorWordAt[j] < to) to = anchorWordAt[j];
                        break;
                    }
                }
                if (!(to > cursor)) to = cursor + 1;
                if (to > limit) to = limit;
            }
            if (to <= cursor) to = Math.min(total, cursor + 1);
            const from = cursor;
            const start = words[from] ? words[from].s : 0;
            const end = words[to - 1] ? words[to - 1].e : start;
            out.push({ t: parts[i], s: start, e: Math.max(end, start + SK46_SEGMENT_MIN_SECONDS) });
            cursor = to;
        }

        for (let i = 1; i < out.length; i++) {
        if (out[i].s < out[i - 1].e) out[i].s = out[i - 1].e;
        if (out[i].e <= out[i].s) out[i].e = out[i].s + SK46_SEGMENT_MIN_SECONDS;
        }
        return out;
    }

    function sk46BuildTranscriptWords(entry) {
        return entry.words && entry.words.length ? entry.words : null;
    }

function sk46PaintKaraoke(t) {
        const body = sk46PopupBody;
        if (!body || !body.classList.contains('karaoke')) return;
        const spans = body.__sk46Spans;
        if (!spans || !spans.length) return;
        for (let i = 0; i < spans.length; i++) {
        const sp = spans[i];
        const started = t >= sp.s;
        const active = started && t < sp.e;
        if (sp.on !== active) {
        sp.on = active;
        sp.el.classList.toggle('on', active);
        }
        
        const past = started && !active;
        if (sp.past !== past) {
        sp.past = past;
        sp.el.classList.toggle('past', past);
        }
        }
    }

    function sk46RenderKaraokeBody(entry, opts) {
        const body = sk46PopupBody;
        const data = sk46KaraokeTextFor(entry);
        
        const allRead = !!(opts && opts.allRead);
        body.__sk46Spans = null;
        if (data.mode === 'plain') {
            body.classList.remove('karaoke');
            
            body.classList.add('plain');
            body.textContent = data.text;
            return;
        }
        const items = data.mode === 'words' ? data.words : data.segs;
        
        if (!items || !items.length) {
            body.classList.remove('karaoke');
            body.classList.add('plain');
            body.textContent = data.text || (entry.transcript || '');
            return;
        }
        body.classList.remove('plain');
        const frag = document.createDocumentFragment();
        const spans = [];
        const pieces = [];
        for (let i = 0; i < items.length; i++) {
            const it = items[i];
            const label = data.mode === 'words' ? it.w : it.t;
            if (!label) continue;
            const sp = document.createElement('span');
            sp.className = allRead ? 'sk46-w past' : 'sk46-w';
            sp.textContent = label;
            frag.appendChild(sp);
            spans.push({ el: sp, s: it.s, e: it.e, on: false, past: allRead });
            pieces.push(label);
            
            const gap = i < items.length - 1
                ? (data.mode === 'words' ? ' ' : (it.sp != null ? it.sp : ' '))
                : '';
            if (gap) {
                frag.appendChild(document.createTextNode(gap));
                pieces.push(gap);
            }
        }
body.textContent = '';
        body.appendChild(frag);
        
        body.classList.toggle('karaoke', !allRead);
        
        body.__sk46Spans = spans;
        body.__sk46AllRead = allRead;
        body.__sk46Text = pieces.join('');
        sk46KaraokeActive = null;
        
        if (!allRead) {
            try { sk46PaintKaraoke(sk46CurrentMediaTime()); } catch (e) { ; }
        }
    }

    function sk46KaraokeTextFor(entry) {
        const hasWords = !!(entry.words && entry.words.length);
        if (!hasWords) {
            return {
                mode: 'plain',
                text: sk46PopupTab === 'translated'
                    ? (entry.translated || '')
                    : (entry.transcript || ''),
            };
        }
        if (sk46PopupTab === 'translated') {
            
            const segs = sk46BuildContextSegments(entry.contexts);
            if (segs) return { mode: 'segments', segs };
            
            const legacy = sk46BuildTranslationSegments(entry.translated, entry.words);
            if (legacy) return { mode: 'segments', segs: legacy };
            return { mode: 'plain', text: entry.translated || '' };
        }
        const words = sk46BuildTranscriptWords(entry);
        if (words) return { mode: 'words', words };
        return { mode: 'plain', text: entry.transcript || '' };
    }

    function sk46RenderPopup(entry) {
        if (!entry) {
            sk46HidePopupChrome();
            return;
        }
        sk46PopupEntry = entry;
        sk46PopupCard.classList.add('visible');
        
        if (!sk46PopupTabPinned && sk46PopupTab === 'original' && entry.translated) {
            sk46PopupTab = 'translated';
        }
        for (const t of sk46PopupShadow.querySelectorAll('.tab')) {
            t.classList.toggle('active', t.getAttribute('data-tab') === sk46PopupTab);
        }
        
        if (sk46PopupTab === 'translated' && !entry.translated && entry.status === 'done' && entry.translationError) {
            sk46PopupBody.textContent = '';
            
            sk46PopupBody.classList.remove('plain');
        } else {
            
            const neverPlayed = !sk46AudioIsPlaying() && sk46CurrentMediaTime() <= 0;
            sk46RenderKaraokeBody(entry, { allRead: neverPlayed });
        }
        sk46PopupBody.classList.toggle('mono', sk46PopupTab === 'original');
        
        sk46ApplyTextDirection(sk46PopupBody, sk46PopupTab === 'translated' && sk46TargetLanguageIsRtl());

        let statusText = '';
        let showRetry = false;
        
        if (entry.waitingForUrl && !entry.url && !entry.transcript) {
            
            statusText = entry.waitingPhase === 'manual'
                ? 'Play this voice message once to get the transcript'
                : entry.waitingPhase === 'loading'
                ? 'Loading the audio…'
                : 'Starting playback briefly to load the audio…';
        }
        else if (entry.status === 'transcribing') statusText = 'Transcribing…';
        else if (entry.status === 'translating') statusText = 'Translating…';
        else if (entry.status === 'error') { statusText = entry.error || 'Failed'; showRetry = true; }
        else if (entry.status === 'done' && sk46PopupTab === 'translated') {
            if (!entry.translated) { statusText = entry.translationError || 'Translation unavailable'; showRetry = true; }
        }
        if (statusText) {
            sk46PopupStatus.classList.add('visible');
            sk46PopupStatusText.textContent = statusText;
            sk46PopupRetry.style.display = showRetry ? 'inline' : 'none';
        } else {
            sk46PopupStatus.classList.remove('visible');
        }
        sk46PositionPopup(entry);
    }

function sk46EntryRect(entry) {
        if (!entry || !entry.el) return null;
        const own = entry.el.getBoundingClientRect();
        if (own.width > 0 && own.height > 0) return own;
        if (entry.msgRect && entry.msgRect.width > 0 && entry.msgRect.height > 0) return entry.msgRect;
        let n = entry.el.parentElement;
        while (n) {
            const r = n.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) return r;
            n = n.parentElement;
        }
        return null;
    }

    function sk46PositionPopup(entry) {
        const SK46_POPUP_CLEARANCE_PX = 8;
        if (!entry || !entry.el || !entry.el.isConnected) {
            sk46HidePopupChrome();
            return;
        }
        const r = sk46EntryRect(entry);
        if (!r || r.width === 0 || r.height === 0) {
            sk46HidePopupChrome();
            return;
        }
        const desired = Math.round(r.width);
        const maxW = window.innerWidth - 16;
        sk46PopupCard.style.width = Math.max(240, Math.min(desired, maxW)) + 'px';
        const cardH = sk46PopupCard.offsetHeight || 200;
        const cardW = sk46PopupCard.offsetWidth || 420;
        const gap = 10;

        let aboveLimit = r.top;
        const tbtn = entry.transcriptEl;
        if (tbtn && tbtn.style.display !== 'none') {
            const tr = tbtn.getBoundingClientRect();
            if (tr.width > 0 && tr.height > 0 && tr.top < r.top) aboveLimit = Math.min(aboveLimit, tr.top);
        } else {
            aboveLimit = r.top + Math.min(0, sk46RefreshBtnOffsetYPx);
        }
        const aboveGap = Math.abs(Math.min(0, sk46RefreshBtnOffsetYPx)) + SK46_POPUP_CLEARANCE_PX;

        const spaceAbove = aboveLimit;
        const spaceBelow = window.innerHeight - r.bottom;
        const fitsAbove = spaceAbove >= cardH + gap + 8;
        const fitsBelow = spaceBelow >= cardH + gap + 8;
        let top;
        if (fitsAbove && spaceAbove >= spaceBelow) top = aboveLimit - cardH - gap;
        else if (fitsBelow) top = r.bottom + gap;
        else if (spaceAbove >= spaceBelow) top = aboveLimit - cardH - gap;
        else top = r.bottom + gap;

        const overlapsBubble = (t) => t < r.bottom + 4 && t + cardH > r.top - 4;
        if (overlapsBubble(top)) {
            const below = r.bottom + gap;
            const above = aboveLimit - cardH - gap;
            if (below + cardH <= window.innerHeight - 8 && below >= 8) top = below;
            else if (above >= 8) top = above;
            else top = 8;
        } else if (top < r.top && top + cardH > aboveLimit - 2) {
            
            const above = aboveLimit - cardH - gap;
            if (above >= 8) top = above;
        }
        if (top + cardH > window.innerHeight - 8) {
            top = Math.max(8, window.innerHeight - cardH - 8);
        }
        if (top < 8) top = 8;
        let left = r.left;
        left = Math.min(left, window.innerWidth - cardW - 8);
        left = Math.max(8, left);
        sk46PopupCard.style.left = left + 'px';
        sk46PopupCard.style.top = top + 'px';
        sk46UpdatePopupBackdrop();
        sk46PopupHideAt = r.bottom;
    }

function sk46OpenPopup(entry, manual) {
        if (!entry) return;
        if (!sk46State.translateEnabled) { sk46ClosePopup(); return; }

        const sameSession = sk46PopupEntry === entry
            && sk46PopupCard.classList.contains('visible');
        sk46PopupEntry = entry;
        if (!sameSession) {
            sk46PopupTabPinned = false;
            
            sk46PopupTab = entry.translated ? 'translated' : 'original';
        }
        sk46RenderPopup(entry);
        if (entry.status !== 'done' && entry.status !== 'error') {
            sk46RunTranscription(entry);
        } else if (entry.status === 'error' && manual) {
            sk46RunTranscription(entry);
        }
    }

    function sk46AudioGroupId() {
        const m = String(location.pathname || '').match(/\/talk\/timeline\/([^/?#]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    }

function sk46AudioAnchorKey(el) {
        const group = sk46AudioGroupId() || 'nogroup';
        let n = el.parentElement;
        while (n) {
        const raw = String(n.getAttribute('aria-label') || '');
        const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
        const stamp = lines.find(l => /\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}/.test(l));
        if (stamp) return group + '|' + stamp;
        n = n.parentElement;
        }
        
        const msgEl = el && el.parentElement;
        const label = msgEl ? String(msgEl.getAttribute('aria-label') || '').trim() : '';
        if (label) return group + '|L:' + sk46HashStr(label);
        
        sk46AnchorFallbackCounter++;
        return group + '|N:' + sk46AnchorFallbackCounter;
    }

    let sk46AnchorFallbackCounter = 0;

    const sk46UrlByAnchor = new Map();
    let sk46LastMediaEl = null;

    function sk46PeekMediaUrlFromElement(preferEl) {
        
        const el = (preferEl && preferEl.querySelector
            ? preferEl.querySelector('audio, video') || preferEl
            : null) || sk46LastMediaEl;
        if (!el) return null;
        const src = el.currentSrc || el.getAttribute('src') || '';
        if (!src || !SK46_MEDIA_PATH_RE.test(src)) return null;
        if (!SK46_AUDIO_EXT_RE.test(sk46AudioFileFromUrl(src))) return null;
        return { el, src };
    }

    function sk46MediaElIsActive(el) {
        if (!el) return false;
        try {
            if (el.paused === true) return false;
            if (el.ended === true) return false;
        } catch { return false; }
        const src = el.currentSrc || el.getAttribute('src') || '';
        return !!(src && SK46_MEDIA_PATH_RE.test(src));
    }

    let sk46HaltUntil = 0;
    let sk46HaltPendingEntry = null;
    let sk46HaltCancellable = false;

    let sk46SyntheticPlayUntil = 0;
    let sk46SyntheticPlayEntry = null;

    const SK46_SYNTHETIC_PLAY_WINDOW_MS = 6000;

    function sk46MarkSyntheticPlay(entry) {
        sk46SyntheticPlayEntry = entry || null;
        sk46SyntheticPlayUntil = Date.now() + SK46_SYNTHETIC_PLAY_WINDOW_MS;
        ;
    }

    function sk46ClaimManualPlay() {
        sk46SyntheticPlayUntil = 0;
        sk46SyntheticPlayEntry = null;
        sk46CancelHalt();
        ;
    }

    function sk46PlaybackIsScriptOwned() {
        return Date.now() < sk46SyntheticPlayUntil && !!sk46SyntheticPlayEntry;
    }

    function sk46CancelHalt() {
        if (!sk46HaltCancellable) return false;
        sk46HaltUntil = 0;
        sk46HaltPendingEntry = null;
        sk46HaltCancellable = false;
        ;
        return true;
    }

    function sk46MaybeHaltPlayback(entry, why) {
        if (!sk46PlaybackIsScriptOwned()) {
            ;
            return false;
        }
        sk46HaltPlaybackSoon(entry);
        return true;
    }

    function sk46PauseViaFlutterButton(entry) {
        if (!entry || !entry.el) {
            ;
            return false;
        }
        if (!entry.el.isConnected) {
            ;
            return false;
        }
        const btn = sk46PlayBtnFor(entry);
        if (!btn) {
            ;
            return false;
        }
        const ok = sk46DispatchPlayClick(btn, 'click-only');
        if (ok) ;
        return ok;
    }

    function sk46HaltPlaybackOnce() {
        const el = sk46LastMediaEl;
        if (!el) return false;
        try {
            if (el.paused !== false) return false;
            el.pause();
            try { el.currentTime = 0; } catch {  }
            for (const type of ['pause', 'timeupdate', 'ended', 'seeked']) {
                try { el.dispatchEvent(new Event(type)); } catch {  }
            }
            ;
            return true;
        } catch {
            return false;
        }
    }

    const SK46_HALT_WINDOW_MS = 4000;
    const SK46_HALT_POLL_MS = 120;
    const SK46_HALT_CONFIRM_MS = 800;

    function sk46HaltPlaybackSoon(entry) {
        sk46HaltPendingEntry = entry || sk46HaltPendingEntry;
        sk46HaltUntil = Date.now() + SK46_HALT_WINDOW_MS;
        sk46HaltCancellable = true;
        let sent = false;
        let clicks = 0;
        let confirmUntil = 0;
        const attempt = () => {
            
            if (Date.now() > sk46HaltUntil) { sk46HaltCancellable = false; return; }
            const el = sk46LastMediaEl;
            const playing = el && el.paused === false;
            if (!playing) { sk46HaltCancellable = false; return; }
            
            sk46HaltPlaybackOnce();
            if (sent && Date.now() > confirmUntil) {
                
                if (++clicks > 2) { sk46HaltCancellable = false; return; }
            }
            if (!sent) {
                sent = sk46PauseViaFlutterButton(sk46HaltPendingEntry);
                if (sent) confirmUntil = Date.now() + SK46_HALT_CONFIRM_MS;
            }
            setTimeout(attempt, SK46_HALT_POLL_MS);
        };
        setTimeout(attempt, 0);
        const el = sk46LastMediaEl;
        if (el && el.addEventListener) {
            el.addEventListener('play', () => {
                setTimeout(() => {
                    
                    if (!sk46PlaybackIsScriptOwned()) { sk46HaltCancellable = false; return; }
                    sk46PauseViaFlutterButton(sk46HaltPendingEntry) || sk46HaltPlaybackOnce();
                }, 120);
            }, { once: true });
        }
    }

    function sk46FindAudioUrlFor(el) {
        const key = sk46AudioAnchorKey(el);
        const rec = sk46UrlByAnchor.get(key);
        if (!rec) return null;
        if (Date.now() - rec.seenAt > SK46_MEDIA_URL_TTL_MS) {
            sk46UrlByAnchor.delete(key);
            return null;
        }
        return rec;
    }

const SK46_FILE_MAP_KEY = sk46GroupKey('audioFileMap');

    function sk46LoadFileMap() {
        try {
            const raw = sk46GmGet(SK46_FILE_MAP_KEY, '{}');
            const o = (typeof raw === 'string') ? JSON.parse(raw) : raw;
            return (o && typeof o === 'object') ? o : {};
        } catch { return {}; }
    }

    function sk46SaveFileMap(map) {
        try { sk46GmSet(SK46_FILE_MAP_KEY, JSON.stringify(map)); } catch {}
    }

    function sk46RememberFileForAnchor(anchorKey, file) {
        if (!anchorKey || !file) return;
        const map = sk46LoadFileMap();
        if (map[anchorKey] === file) return;
        map[anchorKey] = file;
        const keys = Object.keys(map);
        while (keys.length > 300) delete map[keys.shift()];
        sk46SaveFileMap(map);
    }

    function sk46FileForAnchor(anchorKey) {
        if (!anchorKey) return null;
        const map = sk46LoadFileMap();
        return map[anchorKey] || null;
    }

    function sk46FindFreshUrlForAnchor(anchorKey) {
        const file = sk46FileForAnchor(anchorKey);
        if (!file) return null;
        const rec = sk46FindFreshUrlForFile(sk46AudioKeyForFile(file));
        return rec ? rec : null;
    }

    function sk46FileDateStamp(file) {
        const m = String(file || '').match(/-(\d{4})(\d{2})(\d{2})-\d{6}/);
        if (!m) return null;
        return { month: +m[2], day: +m[3] };
    }

    function sk46LabelDateStamp(label) {
        const m = String(label || '').match(/(\d{1,2})\/(\d{1,2})/);
        if (!m) return null;
        return { month: +m[1], day: +m[2] };
    }

    function sk46DateDayDiff(fileDate, labelDate) {
        const f = Date.UTC(2000, fileDate.month - 1, fileDate.day);
        const l = Date.UTC(2000, labelDate.month - 1, labelDate.day);
        return Math.round((f - l) / 86400000);
    }

    function sk46FileDateMatchesLabel(file, msgLabel) {
        const f = sk46FileDateStamp(file);
        const l = sk46LabelDateStamp(msgLabel);
        if (!f || !l) return false;
        const diff = sk46DateDayDiff(f, l);
        return diff === 0 || diff === 1 || diff === -1;
    }

    function sk46BindAudioUrl(entry, url, file) {
        entry.url = url;
        entry.file = file || null;
        entry.fileKey = file ? sk46AudioKeyForFile(file) : null;
        sk46UrlByAnchor.set(entry.anchorKey, {
            key: entry.anchorKey, url, file: entry.file,
            fileKey: entry.fileKey, seenAt: Date.now(),
        });
        sk46RememberFileForAnchor(entry.anchorKey, entry.file);
    }

    function sk46BuildAudioEntries() {
        const bubbles = sk46FindAudioBubbles();
        const out = [];
        const claimed = new Set();
        for (const { el, duration, playBtn } of bubbles) {
            const msgEl = el.parentElement;
            const msgLabel = msgEl ? (msgEl.getAttribute('aria-label') || '').trim() : '';
            const anchorKey = sk46AudioAnchorKey(el);
            let existing = null;
            if (el._sk46AudioEntry && el._sk46AudioEntry.anchorKey === anchorKey) {
                existing = el._sk46AudioEntry;
            } else if (el._sk46AudioEntry && el._sk46AudioEntry.anchorKey) {
                
                existing = el._sk46AudioEntry;
                existing.anchorKey = anchorKey;
                existing.file = null;
                existing.fileKey = null;
                existing.url = null;
                existing.transcript = null;
                existing.translated = null;
                existing.words = null;
                existing.contexts = null;
                existing.status = 'idle';
                existing.error = null;
                existing.translationError = null;
                sk46Trace('entry:reset', { anchor: anchorKey, was: 'node reused for a different message' });
            }
            if (!existing) {
                
                existing = anchorKey
                    ? sk46AudioEntries.find(e => e.anchorKey === anchorKey && !claimed.has(e) && !e.el.isConnected)
                    : null;
            }
            if (!existing) {
                existing = {
                    el, anchorKey, fileKey: null, file: null, url: null,
                    transcript: null, translated: null, words: null, contexts: null,
                    waitingForUrl: false, waitingPhase: null,
                    status: 'idle', error: null, translationError: null,
                    transcriptEl: null,
                };
            }
            claimed.add(existing);
            existing.el = el;
            el._sk46AudioEntry = existing;
            existing.playBtn = playBtn;
            existing.durationLabel = duration;
            existing.msgLabel = msgLabel;
            if (msgEl && typeof msgEl.getBoundingClientRect === 'function') {
                const mr = msgEl.getBoundingClientRect();
                existing.msgRect = mr.width > 0 && mr.height > 0 ? mr : null;
            }
            if (!existing.url) {
                const rec = sk46FindAudioUrlFor(el);
                
                if (rec) {
                    existing.url = rec.url;
                    existing.file = rec.file;
                    existing.fileKey = rec.fileKey;
                }
            }
            
            if (!existing.file) {
                const known = sk46FileForAnchor(anchorKey);
                
                if (known && sk46FileDateMatchesLabel(known, msgLabel)) {
                    existing.file = known;
                    existing.fileKey = sk46AudioKeyForFile(known);
const cached = sk46RecallTranscript(existing);
                    if (cached) {
existing.transcript = cached.transcript;
      existing.translated = cached.translated;
      
      existing.words = cached.words || null;
      
      existing.contexts = cached.contexts || null;
      existing.status = 'done';
      if (!cached.translationFresh && cached.hasStoredTranslation) {
        existing.translationError = 'Retranslating for current settings…';
        ;
      }
    }
                } else if (known) {
                    
                    ;
                }
            }
            if (!existing.transcriptEl) existing.transcriptEl = sk46BuildTranscriptBtn(existing);
            out.push(existing);
        }
        return out;
    }

    function sk46BuildRefreshBtn(entry) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sk46-refresh-btn';
        btn.setAttribute('aria-label', 'Refresh translation');
        btn.innerHTML = SK46_ICON_REFRESH;
        btn.style.width = sk46RefreshBtnSizePx + 'px';
        btn.style.height = sk46RefreshBtnSizePx + 'px';
        btn.style.display = 'none';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sk46RefreshEntryTranslation(entry);
        });
        btn.addEventListener('mousedown', (e) => e.stopPropagation());
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        btn.addEventListener('contextmenu', (e) => e.stopPropagation());
        return btn;
    }

    function sk46UpdateRefreshBtnPosition(entry, rect, visible) {
        const btn = entry.refreshEl;
        if (!btn) return;
        if (!visible) {
            if (btn.style.display !== 'none') btn.style.display = 'none';
            return;
        }
        const sz = sk46RefreshBtnSizePx;
        const left = rect.right - sz - sk46RefreshBtnOffsetXPx;
        const top  = rect.top + sk46RefreshBtnOffsetYPx;
        btn.style.left = left + 'px';
        btn.style.top  = top + 'px';
        btn.style.width = sz + 'px';
        btn.style.height = sz + 'px';
        if (btn.style.display !== 'flex') btn.style.display = 'flex';
    }

    function sk46UpdateRefreshBtnSpinning(entry) {
        const btn = entry.refreshEl;
        if (!btn) return;
        const key = entry.translationKey;
        const autoInFlight = key ? sk46TranslationInFlight.has(key) : false;
        const spinning = !!entry.isRefreshing || autoInFlight;
        btn.classList.toggle('spinning', spinning);
    }

    function sk46RefreshEntryTranslation(entry) {
        if (!entry || !entry.node) return;
        const text = entry.node.text;
        if (!text) return;
        if (entry.isRefreshing) return;
        const key = entry.translationKey || sk46TranslationCacheKey(text);
        entry.translationKey = key;

        entry.isRefreshing = true;
        sk46UpdateRefreshBtnSpinning(entry);
        ;

        sk46GovernorCall(sk46State.provider, () => sk46CallLLMBatch([text]), sk46EstimateCallTokens(null, [text]))
            .then(raw => {
                const parsed = sk46ParseBatchResponse(raw, 1);
                if (!parsed || !parsed[0]) throw new Error('Parse failed');
                sk46TranslationCache.delete(key);
                sk46TranslationCache.set(key, {
                    status: 'done', source: text, translated: parsed[0],
                    error: null, ts: Date.now(),
                });
                sk46SchedulePersistTranslations();
                sk46ApplyTranslationBatch([{ source: text, translated: parsed[0] }]);
                ;
            })
            .catch(err => {
                ;
                sk46TranslationCache.set(key, {
                    status: 'error', source: text, translated: null,
                    error: String(err && err.message || err), ts: Date.now(),
                });
            })
            .finally(() => {
                entry.isRefreshing = false;
                sk46UpdateRefreshBtnSpinning(entry);
            });
    }

    function sk46DecideAnchorMode(rect, naturalHeight) {
        const SK46_PICTURE_CAPTION_MIN_HEIGHT = 200;
        const SK46_PICTURE_CAPTION_MAX_RATIO = 0.4;
        if (sk46IsAtTopBoundaryStrict(rect)) return 'bottom';
        if (rect.height > SK46_PICTURE_CAPTION_MIN_HEIGHT
            && naturalHeight / rect.height < SK46_PICTURE_CAPTION_MAX_RATIO) return 'bottom';
        return 'center';
    }
    function sk46ApplyMirrorAnchor(mirrorEl, rect, mode, naturalHeight) {
        const SK46_MIRROR_CONTAINER_PAD_RIGHT = 45;
        const SK46_MIRROR_CONTAINER_PAD_LEFT = 45;
        mirrorEl.dataset.sk46Anchor = mode;
        mirrorEl.style.left = rect.left + 'px';
        mirrorEl.style.width = rect.width + 'px';
        mirrorEl.style.paddingLeft = SK46_MIRROR_CONTAINER_PAD_LEFT + 'px';
        mirrorEl.style.paddingRight = (SK46_MIRROR_CONTAINER_PAD_RIGHT + sk46State.mirrorRightPadExtraPx) + 'px';
        if (mode === 'bottom') {
            const bottomPx = (window.innerHeight - rect.bottom) - sk46State.pictureCaptionBiasPx;
            mirrorEl.style.top = '';
            mirrorEl.style.bottom = bottomPx + 'px';
            mirrorEl.style.paddingTop = SK46_MIRROR_CONTAINER_PAD_Y + 'px';
            mirrorEl.style.paddingBottom = SK46_MIRROR_CONTAINER_PAD_Y + 'px';
            mirrorEl.style.overflow = 'hidden';
            mirrorEl.style.maxHeight = sk46IsAtTopBoundary(rect) ? 'none' : rect.height + 'px';
        } else {
            mirrorEl.style.top = (rect.top + sk46State.textTopPadPx) + 'px';
            mirrorEl.style.bottom = '';
            mirrorEl.style.paddingTop = '0px';
            mirrorEl.style.paddingBottom = '0px';
            mirrorEl.style.overflow = 'visible';
            mirrorEl.style.maxHeight = 'none';
        }
    }

    function sk46ResolveMirrorKind() {
        if (sk46State.preview) return 'preview';
        if (sk46State.debugMirrorText) return 'debug';
        return 'none';
    }

    function sk46BuildMirror(n, kind) {
        const container = document.createElement('div');
        container.className = 'sk46-mirror-container';
        container.style.width = n.rect.width + 'px';
        const text = document.createElement('div');
        text.className = 'sk46-mirror-text'
            + (kind === 'preview' ? ' sk46-mirror-text--preview' : '');
        let displayText = n.text;
        let usedCache = false;
        if (kind === 'preview' && sk46State.translateEnabled) {
            const key = sk46TranslationCacheKey(n.text);
            const cached = sk46TranslationCache.get(key);
            if (cached && cached.status === 'done' && cached.translated) {
                displayText = cached.translated;
                usedCache = true;
            }
        }
        text.textContent = displayText;
        sk46ApplyTextDirection(text, usedCache && sk46TargetLanguageIsRtl());
        container.appendChild(text);
        if (usedCache) {
            try { void text.offsetHeight; } catch {}
        }
        if (kind === 'preview' && sk46State.translateEnabled) {
            sk46TranslationStats.entriesSeen++;
            if (usedCache) sk46TranslationStats.entriesTranslatedAtBuild++;
        }
        return container;
    }

    function sk46TextContentRect(mirrorEl) {
        const r = mirrorEl.firstElementChild.getBoundingClientRect();
        return {
            left: r.left + SK46_MIRROR_TEXT_PAD,
            top: r.top + SK46_MIRROR_TEXT_PAD,
            width: Math.max(0, r.width - 2 * SK46_MIRROR_TEXT_PAD),
            height: Math.max(0, r.height - 2 * SK46_MIRROR_TEXT_PAD),
        };
    }
    function sk46BgRectFromTextRect(textRect, kind) {
        if (kind !== 'preview') return textRect;
        const t = sk46State.mirrorBgBleedTopPx;
        const r = sk46State.mirrorBgBleedRightPx;
        const b = sk46State.mirrorBgBleedBottomPx;
        const l = sk46State.mirrorBgBleedLeftPx;
        return {
            left: textRect.left - l,
            top: textRect.top - t,
            width: Math.max(0, textRect.width + l + r),
            height: Math.max(0, textRect.height + t + b),
        };
    }
    function sk46BuildMirrorBg(textRect, kind) {
        const bgRect = sk46BgRectFromTextRect(textRect, kind);
        const bg = document.createElement('div');
        bg.className = 'sk46-mirror-bg'
            + (kind === 'preview' ? ' sk46-mirror-bg--preview' : '');
        bg.style.left = bgRect.left + 'px';
        bg.style.top = bgRect.top + 'px';
        bg.style.width = bgRect.width + 'px';
        bg.style.height = bgRect.height + 'px';
        return bg;
    }

    function sk46RebuildScan() {
        const t0 = performance.now();

        sk46SyncProfileNickname();

        const host = document.querySelector(SK46_FLUTTER_HOST);
        const nodes = sk46ClassifyTree(host);
        sk46LastNodes = nodes;
        sk46LastRebuildAt = new Date();
        sk46DebugSeam.bumpRebuild();

        const isNonChatPage = sk46DetectNonChatPage(nodes);
        sk46PageKind = isNonChatPage ? 'non-chat' : 'chat';

        sk46ChatColumns = sk46ComputeChatColumns(nodes);
        const unreadEls = sk46State.skipUnreadButtons ? sk46FindUnreadTextEls(nodes) : new Set();

        sk46BootstrapStickyBoundary(nodes);

        if (sk46LastRebuildPath !== location.pathname) {
            sk46LastRebuildPath = location.pathname;
            sk46CachedScrollContainerEl = null;
            sk46ChatScrollBottomBoundary = 0;
            sk46ChatScrollContainerEl = null;
            sk46BottomBoundarySource = 'init';
            sk46ResetSenderColor();
        }
        sk46RefreshChatBottomBoundary();

        if (!isNonChatPage && !sk46SenderColor) {
            let ok = false;
            try { ok = sk46TryDetectSenderColor(false); } catch (e) { ok = false; }
            if (!ok) sk46ScheduleSenderColorRetry();
        }

        sk46OverlayLayer.textContent = '';
        sk46MirrorLayer.textContent = '';
        sk46MirrorBgLayer.textContent = '';
        sk46RefreshLayer.textContent = '';
        sk46TextEntries = [];
        sk46SetHoverEntry(null);
        sk46HoverDirty = true;
        sk46DebugSeam.clearState();

        for (const old of sk46AudioEntries) {
            if (old.transcriptEl && old.transcriptEl.parentNode) old.transcriptEl.parentNode.removeChild(old.transcriptEl);
        }
        sk46AudioEntries = sk46BuildAudioEntries();
        if (sk46AudioVisibleNow()) {
            for (const ae of sk46AudioEntries) {
                if (!ae.transcriptEl.parentNode) sk46RefreshLayer.appendChild(ae.transcriptEl);
            }
            ;
        } else if (sk46PopupEntry) {
            sk46ClosePopup();
        }
        return { t0, nodes, isNonChatPage, unreadEls };
    }

    function sk46RebuildOverlayState(nodes, isNonChatPage) {
        const containers = nodes.filter(n => n.category === 'container');
        const leaves = nodes.filter(n => n.category !== 'container' && n.category !== 'empty-zero');

        const mirrorKind = sk46ResolveMirrorKind();
        const wantMirror = mirrorKind !== 'none' && !isNonChatPage;
        const wantBg = wantMirror && (mirrorKind === 'preview' || sk46State.debugMirrorBg);
        const wantRefreshBtn = wantMirror && mirrorKind === 'preview' && sk46State.translateEnabled;

        let skippedZero = 0, skippedWidget = 0, skippedOffColumn = 0, skippedUnread = 0;
        let textMirrorsCreated = 0, textMirrorsHiddenAtCreate = 0, refreshBtnsCreated = 0;

        if (sk46State.debugContainers) {
            containers.forEach(n => {
                if (n.rect.width === 0 || n.rect.height === 0) { skippedZero++; return; }
                try {
                    const boxEl = sk46DebugBox(n);
                    if (boxEl) sk46OverlayLayer.appendChild(boxEl);
                    const dbgId = sk46DebugSeam.nextId();
                    sk46TextEntries.push({
                        node: n, boxEl, mirrorEl: null, bgEl: null, bgKind: null,
                        refreshEl: null, translationKey: null, isRefreshing: false,
                        dbgId, dbgTextPreview: n.text || '(container)',
                        anchorMode: null, naturalHeight: null,
                        origTextW: 0, origTextH: 0,
                        origTextTopFromTop: 0, origTextTopFromBottom: 0,
                    });
                } catch (e) {
                    ;
                }
            });
        }
        return {
            leaves, mirrorKind, wantMirror, wantBg, wantRefreshBtn,
            skippedZero, skippedWidget, skippedOffColumn, skippedUnread,
            textMirrorsCreated, textMirrorsHiddenAtCreate, refreshBtnsCreated,
        };
    }

    function sk46FullRebuild() {
        const { t0, nodes, isNonChatPage, unreadEls } = sk46RebuildScan();

        const overlayState = sk46RebuildOverlayState(nodes, isNonChatPage);
        const { leaves, mirrorKind, wantMirror, wantBg, wantRefreshBtn } = overlayState;
        let {
            skippedZero, skippedWidget, skippedOffColumn, skippedUnread,
            textMirrorsCreated, textMirrorsHiddenAtCreate, refreshBtnsCreated,
        } = overlayState;

        let buildErrors = 0;
        let sk46FirstBuildError = null;
        leaves.forEach((n, leafIndex) => {
          try {
            if (n.rect.width === 0 || n.rect.height === 0) { skippedZero++; return; }
            const boxEl = sk46DebugBox(n);
            if (boxEl) sk46OverlayLayer.appendChild(boxEl);

            const dbgId = sk46DebugSeam.nextId();
            let mirrorEl = null, bgEl = null, bgKind = null, naturalHeight = null, anchorMode = null;
            let refreshEl = null, translationKey = null;
            let origTextW = 0, origTextH = 0;
            let origTextTopFromTop = 0, origTextTopFromBottom = 0;

            const isUnread = unreadEls.has(n.el);
            const isRealText = sk46IsRealTextMessage(n, sk46ChatColumns, unreadEls);
            if (wantMirror && isRealText) {
                mirrorEl = sk46BuildMirror(n, mirrorKind);
                textMirrorsCreated++;
                const atBottom = sk46IsAtBottomBoundary(n.rect);
                if (atBottom) { mirrorEl.style.display = 'none'; textMirrorsHiddenAtCreate++; }
                sk46MirrorLayer.appendChild(mirrorEl);
                naturalHeight = mirrorEl.firstElementChild.getBoundingClientRect().height;
                anchorMode = sk46DecideAnchorMode(n.rect, naturalHeight);
                sk46ApplyMirrorAnchor(mirrorEl, n.rect, anchorMode, naturalHeight);
                sk46ApplyHeaderClip(mirrorEl, mirrorEl.getBoundingClientRect(), { dbgId, dbgTextPreview: n.text }, 'mirror');

                if (wantBg) {
                    bgKind = mirrorKind;
                    const _bgTextEl = mirrorEl.firstElementChild;
                    const _bgSavedContent = _bgTextEl.textContent;
                    const _bgNeedSwap = _bgSavedContent !== n.text;
                    if (_bgNeedSwap) {
                        _bgTextEl.textContent = n.text;
                        try { void _bgTextEl.offsetHeight; } catch {}
                    }
                    const textRect = sk46TextContentRect(mirrorEl);
                    const mirrorRectNow = mirrorEl.getBoundingClientRect();
                    origTextW = textRect.width;
                    origTextH = textRect.height;
                    if (anchorMode === 'bottom') {
                        origTextTopFromBottom = mirrorRectNow.bottom - textRect.top;
                    } else {
                        origTextTopFromTop = textRect.top - mirrorRectNow.top;
                    }
                    if (_bgNeedSwap) {
                        _bgTextEl.textContent = _bgSavedContent;
                        try { void _bgTextEl.offsetHeight; } catch {}
                    }
                    try { mirrorEl.firstElementChild.style.transform = ''; } catch {}
                    bgEl = sk46BuildMirrorBg(textRect, bgKind);
                    if (atBottom) bgEl.style.display = 'none';
                    sk46MirrorBgLayer.appendChild(bgEl);
                    sk46ApplyHeaderClip(bgEl, sk46BgRectFromTextRect(textRect, bgKind), { dbgId, dbgTextPreview: n.text }, 'bg');
                }

                if (wantRefreshBtn) {
                    translationKey = sk46TranslationCacheKey(n.text);
                    refreshBtnsCreated++;
                }
            } else if (wantMirror && n.category === 'text') {
                if (isUnread) skippedUnread++;
                else if (n.rect.height < SK46_TEXT_MIRROR_MIN_HEIGHT_PX) skippedWidget++;
                else if (!sk46HasJapanese(n.text) && sk46ChatColumns && sk46ChatColumns.length > 0) skippedOffColumn++;
            }

            const entry = {
                node: n, boxEl, mirrorEl, bgEl, bgKind,
                refreshEl: null, translationKey, isRefreshing: false,
                dbgId, dbgTextPreview: n.text,
                anchorMode, naturalHeight,
                origTextW, origTextH,
                origTextTopFromTop, origTextTopFromBottom,
            };

            if (wantRefreshBtn && isRealText) {
                refreshEl = sk46BuildRefreshBtn(entry);
                entry.refreshEl = refreshEl;
                sk46RefreshLayer.appendChild(refreshEl);
            }

            sk46TextEntries.push(entry);
          } catch (e) {
            buildErrors++;
            if (!sk46FirstBuildError) sk46FirstBuildError = String((e && e.message) || e);
            ;
          }
        });

        try {
            const byCat = {};
            for (const n of nodes) byCat[n.category] = (byCat[n.category] || 0) + 1;
            sk46MirrorLayer.setAttribute('data-sk46-diag', JSON.stringify({
                mirrorKind: mirrorKind,
                wantMirror: wantMirror, wantBg: wantBg, wantRefreshBtn: wantRefreshBtn,
                isNonChatPage: isNonChatPage, pageKind: sk46PageKind,
                preview: sk46State.preview, translateEnabled: sk46State.translateEnabled,
                skipUnreadButtons: sk46State.skipUnreadButtons,
                unreadSuppressed: sk46UnreadSuppressed,
                nodesTotal: nodes.length, nodesByCategory: byCat, leaves: leaves.length,
                textLeaves: nodes.filter(function (n) { return n.category === 'text'; }).length,
                textMirrorsCreated: textMirrorsCreated, refreshBtnsCreated: refreshBtnsCreated,
                skippedZero: skippedZero, skippedUnread: skippedUnread,
                skippedWidget: skippedWidget, skippedOffColumn: skippedOffColumn,
                buildErrors: buildErrors, firstBuildError: sk46FirstBuildError,
            }));
        } catch (e) {
            sk46MirrorLayer.setAttribute('data-sk46-diag', 'ERR ' + String(e && e.message || e));
        }
        const elapsed = (performance.now() - t0).toFixed(2);
        sk46TranslationStats.rebuilds++;
        ;

        if (wantMirror && mirrorKind === 'preview' && sk46State.translateEnabled) {
            sk46FlushTranslationBatch();
        }

        sk46SyncDebugBox(nodes);
        sk46PositionTranslateBtn();
        sk46ForceRepaint();
    }

function sk46AudioVisibleNow() {
        if (!sk46State.preview) return false;
        if (!sk46State.translateEnabled) return false;
        return sk46PageKind !== 'non-chat';
    }

    function sk46ApplyTranscribeToggle() {
        
        if (sk46ToggleTranscribeEl) {
            sk46ToggleTranscribeEl.classList.toggle('on', !!sk46State.autoTranscribe);
            sk46ToggleTranscribeEl.setAttribute('aria-checked', String(!!sk46State.autoTranscribe));
        }
        sk46ClosePopup();
        ;
    }

    function sk46RepositionPopup() {
        const SK46_POPUP_CLOSE_DISTANCE_PX = 420;
        if (sk46PopupEntry) {
            const pe = sk46PopupEntry;
            if (!pe.el || !pe.el.isConnected || sk46AudioEntries.indexOf(pe) === -1) {
                sk46ClosePopup();
            } else {
                const pr = sk46EntryRect(pe);
                if (!pr) { sk46ClosePopup(); } else {
                const dist = sk46PopupHideAt == null
                    ? 0
                    : (sk46PopupHideAt <= pr.bottom ? pr.top - sk46PopupHideAt : sk46PopupHideAt - pr.bottom);
                const absDist = Math.abs(dist);
                const offscreen = pr.bottom < 0 || pr.top > window.innerHeight;
                if (absDist > SK46_POPUP_CLOSE_DISTANCE_PX || offscreen) {
                    ;
                    sk46ClosePopup();
                } else {
                    sk46PositionPopup(pe);
                }
                }
            }
        }
    }

    function sk46PurgeDisconnectedEntries() {
        let purged = 0;
        for (let i = sk46TextEntries.length - 1; i >= 0; i--) {
            const e = sk46TextEntries[i];
            if (!e.node.el.isConnected) {
                if (e.boxEl && e.boxEl.parentNode) e.boxEl.parentNode.removeChild(e.boxEl);
                if (e.mirrorEl && e.mirrorEl.parentNode) e.mirrorEl.parentNode.removeChild(e.mirrorEl);
                if (e.bgEl && e.bgEl.parentNode) e.bgEl.parentNode.removeChild(e.bgEl);
                if (e.refreshEl && e.refreshEl.parentNode) e.refreshEl.parentNode.removeChild(e.refreshEl);
                sk46DebugSeam.dropState(e.dbgId);
                sk46TextEntries.splice(i, 1);
                purged++;
            }
        }
        if (purged > 0) {
            clearTimeout(sk46RebuildTimer);
            sk46RebuildTimer = setTimeout(sk46FullRebuild, 30);
        }
    }

    function sk46PositionOverlayRects() {
        const rects = new Array(sk46TextEntries.length);
        for (let i = 0; i < sk46TextEntries.length; i++) {
            rects[i] = sk46TextEntries[i].node.el.getBoundingClientRect();
        }
        for (let i = 0; i < sk46TextEntries.length; i++) {
            const entry = sk46TextEntries[i];
            const { boxEl, mirrorEl, bgEl, refreshEl } = entry;
            const r = rects[i];
            const hidden = r.width === 0 || r.height === 0;
            const hideForBottomBoundary = !hidden && mirrorEl && sk46IsAtBottomBoundary(r);

            if (boxEl && sk46State.debugWireframe) {
                if (hidden) boxEl.style.display = 'none';
                else {
                    boxEl.style.display = '';
                    boxEl.style.left = r.left + 'px';
                    boxEl.style.top = r.top + 'px';
                    boxEl.style.width = r.width + 'px';
                    boxEl.style.height = r.height + 'px';
                }
            }
            if (mirrorEl) {
                if (hidden) { mirrorEl.style.display = 'none'; if (bgEl) bgEl.style.display = 'none'; }
                else if (hideForBottomBoundary) {
                    mirrorEl.style.display = 'none'; if (bgEl) bgEl.style.display = 'none';
                } else {
                    mirrorEl.style.display = '';
                    const mode = sk46DecideAnchorMode(r, entry.naturalHeight || 0);
                    entry.anchorMode = mode;
                    sk46ApplyMirrorAnchor(mirrorEl, r, mode, entry.naturalHeight || 0);
                }
            }
            if (refreshEl) {
                const buttonTop = r.top + sk46RefreshBtnOffsetYPx;
                const overlapsHeader = buttonTop < sk46StickyBoundary - SK46_STICKY_EPSILON_PX;
                const visible = !hidden && !hideForBottomBoundary && !overlapsHeader;
                sk46UpdateRefreshBtnPosition(entry, r, visible);
                sk46UpdateRefreshBtnSpinning(entry);
            }
        }

        for (let i = 0; i < sk46AudioEntries.length; i++) {
            const ae = sk46AudioEntries[i];
            const ar = sk46EntryRect(ae);
            const aVisible = sk46AudioVisibleNow() && !!ar
                && (ar.top + sk46RefreshBtnOffsetYPx) >= sk46StickyBoundary - SK46_STICKY_EPSILON_PX;
            sk46UpdateTranscriptBtnPosition(ae, ar, aVisible);
            sk46UpdateTranscriptBtnState(ae);
        }

        const mirrorReads = [];
        for (let i = 0; i < sk46TextEntries.length; i++) {
            const entry = sk46TextEntries[i];
            const { mirrorEl, bgEl, bgKind } = entry;
            if (!mirrorEl || mirrorEl.style.display === 'none') continue;
            mirrorReads.push({
                entry, mirrorEl, bgEl, bgKind,
                mirrorRect: mirrorEl.getBoundingClientRect(),
                textRect: bgEl ? sk46TextContentRect(mirrorEl) : null,
            });
        }
        return mirrorReads;
    }

    function sk46ApplyOverlayGeometry(mirrorReads) {
        for (const { entry, mirrorEl, bgEl, bgKind, mirrorRect, textRect } of mirrorReads) {
            sk46ApplyHeaderClip(mirrorEl, mirrorRect, entry, 'mirror');
            if (bgEl && textRect) {
                const bleedL = sk46State.mirrorBgBleedLeftPx;
                const bleedT = sk46State.mirrorBgBleedTopPx;
                const bleedR = sk46State.mirrorBgBleedRightPx;
                const bleedB = sk46State.mirrorBgBleedBottomPx;

                let newTextTop;
                if (entry.anchorMode === 'bottom') {
                    newTextTop = mirrorRect.bottom - (entry.origTextTopFromBottom || 0);
                } else {
                    newTextTop = mirrorRect.top + (entry.origTextTopFromTop || 0);
                }

                const textEl = mirrorEl.firstElementChild;
                if (textEl) {
                    const padTop = (entry.anchorMode === 'bottom') ? SK46_MIRROR_CONTAINER_PAD_Y : 0;
                    const naturalTextTop = mirrorRect.top + padTop + SK46_MIRROR_TEXT_PAD;
                    const delta = newTextTop - naturalTextTop;
                    if (Math.abs(delta) > 0.5) {
                        textEl.style.transform = `translateY(${Math.round(delta * 100) / 100}px)`;
                    } else if (textEl.style.transform) {
                        textEl.style.transform = '';
                    }
                }

                const bgLeft = textRect.left - bleedL;
                const bgTop  = newTextTop - bleedT;
                const bgW = (entry.origTextW > 0)
                    ? entry.origTextW + bleedL + bleedR
                    : textRect.width + bleedL + bleedR;
                const bgH = (entry.origTextH > 0)
                    ? entry.origTextH + bleedT + bleedB
                    : textRect.height + bleedT + bleedB;

                bgEl.style.display = '';
                bgEl.style.left = bgLeft + 'px';
                bgEl.style.top = bgTop + 'px';
                bgEl.style.width = bgW + 'px';
                bgEl.style.height = bgH + 'px';
                sk46ApplyHeaderClip(bgEl, { left: bgLeft, top: bgTop, width: bgW, height: bgH }, entry, 'bg');
            }
        }
    }

    const SK46_HOVER_DELAY_MS = 300;

    function sk46ApplyHoverEntry(entry) {
        if (sk46HoverEntry === entry) return;
        if (sk46HoverEntry) {
            if (sk46HoverEntry.mirrorEl) sk46HoverEntry.mirrorEl.classList.remove('sk46-hover-fade');
            if (sk46HoverEntry.bgEl) sk46HoverEntry.bgEl.classList.remove('sk46-hover-fade');
        }
        sk46HoverEntry = entry || null;
        if (sk46HoverEntry) {
            if (sk46HoverEntry.mirrorEl) sk46HoverEntry.mirrorEl.classList.add('sk46-hover-fade');
            if (sk46HoverEntry.bgEl) sk46HoverEntry.bgEl.classList.add('sk46-hover-fade');
        }
    }

    function sk46SetHoverEntry(entry) {
        entry = entry || null;
        if (!entry) {
            if (sk46HoverTimer) { clearTimeout(sk46HoverTimer); sk46HoverTimer = null; }
            sk46HoverPending = null;
            sk46ApplyHoverEntry(null);
            return;
        }
        
        if (entry === sk46HoverEntry) {
            if (sk46HoverTimer) { clearTimeout(sk46HoverTimer); sk46HoverTimer = null; sk46HoverPending = null; }
            return;
        }
        if (entry === sk46HoverPending) return;
        if (sk46HoverTimer) { clearTimeout(sk46HoverTimer); sk46HoverTimer = null; }
        sk46HoverPending = entry;
        sk46HoverTimer = setTimeout(() => {
            sk46HoverTimer = null;
            sk46HoverPending = null;
            sk46ApplyHoverEntry(entry);
        }, SK46_HOVER_DELAY_MS);
    }

    function sk46UpdateHoverPeek() {
        if (!sk46HoverEnabled || !sk46HoverDirty) return;
        sk46HoverDirty = false;
        const p = sk46HoverPoint;
        if (!p || sk46State.sheetOpen || sk46PopupEntry) {
            sk46SetHoverEntry(null);
            return;
        }
        let hit = null;
        for (const entry of sk46TextEntries) {
            const el = entry.bgEl;
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) continue;
            if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) {
                hit = entry;
                break;
            }
        }
        sk46SetHoverEntry(hit);
    }

    function sk46OnHoverMove(e) {
        if (!sk46HoverEnabled) return;
        const t = e.target;
        if (t && t.closest && t.closest('#sk46-translate-btn, .sk46-refresh-btn')) {
            sk46HoverPoint = null;
            sk46HoverDirty = true;
            return;
        }
        sk46HoverPoint = { x: e.clientX, y: e.clientY };
        sk46HoverDirty = true;
    }

    function sk46OnHoverLeave() {
        if (!sk46HoverEnabled) return;
        sk46HoverPoint = null;
        sk46HoverDirty = true;
    }

    function sk46Reposition() {
        
        if (sk46SyncKaraoke()) sk46EnsureKaraokeLoop();
        sk46UpdateMirrorMask();
        sk46PositionTranslateBtn();
        if (sk46State.sheetOpen) sk46PositionSheet();

        sk46RepositionPopup();

        sk46PurgeDisconnectedEntries();

        const mirrorReads = sk46PositionOverlayRects();
        sk46ApplyOverlayGeometry(mirrorReads);
        sk46UpdateHoverPeek();
    }

    function sk46RepositionLoop() {
        sk46Reposition();
        sk46RafLoopId = requestAnimationFrame(sk46RepositionLoop);
    }

    function sk46ForceRepaint() {
        try {
            void sk46MirrorLayer.offsetHeight;
            void sk46MirrorBgLayer.offsetHeight;
            for (const entry of sk46TextEntries) {
                if (!entry || !entry.mirrorEl) continue;
                void entry.mirrorEl.offsetHeight;
            }
        } catch (e) {  }
        try {
            const layers = [sk46MirrorLayer, sk46MirrorBgLayer];
            for (const layer of layers) {
                if (!layer) continue;
                const prev = layer.style.transform || '';
                layer.style.transform = prev
                    ? prev + ' translateZ(0.0001px)'
                    : 'translateZ(0.0001px)';
                void layer.offsetHeight;
                layer.style.transform = prev;
            }
        } catch (e) {  }
    }

    function sk46RefreshMirrorsFromCache() {
        if (!sk46State.translateEnabled || !sk46State.preview) return 0;
        let updated = 0;
        for (const entry of sk46TextEntries) {
            if (!entry || !entry.mirrorEl || !entry.mirrorEl.isConnected) continue;
            const textEl = entry.mirrorEl.firstElementChild;
            if (!textEl || !textEl.classList.contains('sk46-mirror-text--preview')) continue;
            const key = sk46TranslationCacheKey(entry.node.text);
            const cached = sk46TranslationCache.get(key);
            const hasTranslation = !!(cached && cached.status === 'done' && cached.translated);
            const targetText = hasTranslation ? cached.translated : entry.node.text;
            sk46ApplyTextDirection(textEl, hasTranslation && sk46TargetLanguageIsRtl());
            if (textEl.textContent !== targetText) {
                textEl.textContent = targetText;
                try { void textEl.offsetHeight; } catch {}
                updated++;
            }
        }
        return updated;
    }

    function sk46OnScroll() {
        if (sk46StickyScrollRafPending || sk46TextEntries.length === 0) return;
        sk46StickyScrollRafPending = true;
        requestAnimationFrame(() => {
            sk46StickyScrollRafPending = false;
            if (sk46HoverPoint) sk46HoverDirty = true;
            sk46RefreshChatBottomBoundary();
            const items = sk46TextEntries.map(e => {
                const r = e.node.el.getBoundingClientRect();
                return { el: e.node.el, top: r.top, bottom: r.bottom };
            });
            let anyMoved = false, hadPrevious = false;
            for (const item of items) {
                const prevTop = sk46LastScrollCheckPositions.get(item.el);
                if (prevTop === undefined) continue;
                hadPrevious = true;
                if (Math.abs(prevTop - item.top) >= SK46_STICKY_EPSILON_PX) { anyMoved = true; break; }
            }
            sk46LastScrollCheckPositions = new Map(items.map(it => [it.el, it.top]));
            if (hadPrevious && !anyMoved) return;
            sk46UpdateStickyTracking(items);
        });
    }

    function sk46ScheduleRebuild() {
        clearTimeout(sk46RebuildTimer);
        sk46RebuildTimer = setTimeout(sk46FullRebuild, 150);
    }

    window.addEventListener('scroll', sk46OnScroll, true);
    window.addEventListener('resize', sk46OnScroll);
    window.addEventListener('resize', () => { if (sk46State.sheetOpen) sk46PositionSheet(); });

    const SK46_FLOATING_BTN_MIN_SIZE_PX = 40;
    const SK46_FLOATING_BTN_MAX_SIZE_PX = 100;
    const SK46_FLOATING_BTN_ASPECT_MIN = 0.7;
    const SK46_FLOATING_BTN_ASPECT_MAX = 1.4;

    function sk46FindFloatingButtons(host) {
        if (!host) return [];
        const vh = window.innerHeight, vw = window.innerWidth;
        const found = [], seen = new Set();
        const consider = (r, source) => {
            if (r.width < SK46_FLOATING_BTN_MIN_SIZE_PX) return;
            if (r.height < SK46_FLOATING_BTN_MIN_SIZE_PX) return;
            if (r.width > SK46_FLOATING_BTN_MAX_SIZE_PX) return;
            if (r.height > SK46_FLOATING_BTN_MAX_SIZE_PX) return;
            if (r.top < vh * 0.5) return;
            if (r.left < vw * 0.5) return;
            const key = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
            if (seen.has(key)) return;
            seen.add(key);
            found.push({ rect: r, source });
        };
        for (const b of host.querySelectorAll('flt-semantics[role="button"]')) {
            if (b.querySelector('flt-semantics, flt-semantics-container')) continue;
            consider(b.getBoundingClientRect(), 'role');
        }
        for (const n of sk46LastNodes) {
            if (n.category !== 'empty-square') continue;
            if (!n.el.isConnected) continue;
            const r = n.el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            const ratio = r.width / r.height;
            if (ratio < SK46_FLOATING_BTN_ASPECT_MIN || ratio > SK46_FLOATING_BTN_ASPECT_MAX) continue;
            consider(r, 'geo');
        }
        return found.map(f => f.rect);
    }

    function sk46ClearMirrorMask() {
        for (const el of SK46_MASKED_LAYERS) {
            el.style.maskImage = ''; el.style.webkitMaskImage = '';
            el.style.maskSize = ''; el.style.webkitMaskSize = '';
            el.style.maskRepeat = ''; el.style.webkitMaskRepeat = '';
            el.style.maskPosition = ''; el.style.webkitMaskPosition = '';
            el.style.maskMode = ''; el.style.webkitMaskMode = '';
        }
        sk46LastMaskKey = '';
    }

    function sk46ApplyMirrorMask(btnRects) {
        const vw = window.innerWidth, vh = window.innerHeight, pad = 6;
        if (btnRects.length === 0) { sk46ClearMirrorMask(); return; }
        let path = `M0,0 H${vw} V${vh} H0 Z`;
        for (const r of btnRects) {
            const x = Math.max(0, Math.floor(r.left) - pad);
            const y = Math.max(0, Math.floor(r.top) - pad);
            const w = Math.min(vw - x, Math.ceil(r.width) + pad * 2);
            const h = Math.min(vh - y, Math.ceil(r.height) + pad * 2);
            if (w <= 0 || h <= 0) continue;
            path += ` M${x},${y} h${w} v${h} h-${w} Z`;
        }
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}"><path d="${path}" fill="white" fill-rule="evenodd"/></svg>`;
        const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        for (const el of SK46_MASKED_LAYERS) {
            el.style.webkitMaskImage = uri; el.style.maskImage = uri;
            el.style.webkitMaskSize = `${vw}px ${vh}px`; el.style.maskSize = `${vw}px ${vh}px`;
            el.style.webkitMaskRepeat = 'no-repeat'; el.style.maskRepeat = 'no-repeat';
            el.style.webkitMaskPosition = '0 0'; el.style.maskPosition = '0 0';
            el.style.webkitMaskMode = 'alpha'; el.style.maskMode = 'alpha';
        }
    }

    function sk46UpdateMirrorMask() {
        if (!sk46State.maskFloatingButtons) {
            if (sk46LastMaskKey !== '__off__') { sk46ClearMirrorMask(); sk46LastMaskKey = '__off__'; }
            return;
        }
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return;
        const btnRects = sk46FindFloatingButtons(host);
        const key = btnRects.map(r => `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`).join('|');
        if (key === sk46LastMaskKey) return;
        sk46LastMaskKey = key;
        sk46ApplyMirrorMask(btnRects);
    }

    const sk46TranslateBtn = document.createElement('button');
    sk46TranslateBtn.id = 'sk46-translate-btn';
    sk46TranslateBtn.type = 'button';
    sk46TranslateBtn.setAttribute('aria-label', 'Translate');
    sk46TranslateBtn.innerHTML = SK46_ICON_TRANSLATE;

    const sk46SheetHost = document.createElement('div');
    sk46SheetHost.id = 'sk46-sheet-host';
    sk46SheetHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483601;';
    const sk46SheetShadow = sk46SheetHost.attachShadow({ mode: 'open' });

    const sk46LangListHtml = SK46_SUPPORTED_LANGUAGES.map(lang =>
        `<div class="pick-item lang-item" data-lang="${lang}">${lang}</div>`
    ).join('');
    const sk46ProviderListHtml = SK46_PROVIDERS.map(p =>
        `<div class="pick-item provider-item" data-provider="${p.id}">${p.label}</div>`
    ).join('');

    const SK46_SHEET_TEMPLATE = `
        <style>
            :host { all: initial; }
            * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
            #backdrop { position: fixed; inset: 0; background: rgb(0 0 0 / 40%); opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
            #backdrop.visible { opacity: 1; pointer-events: auto; }
            #sheet {
                position: fixed; bottom: 0; background: #ffffff;
                box-shadow: 0 -2px 16px rgba(0,0,0,.05);
                transform: translateY(100%);
                transition: transform 0.24s cubic-bezier(.2,.8,.2,1);
                pointer-events: auto; overflow: hidden;
                display: flex; flex-direction: column;
                max-height: 580px; padding-bottom: 36px;
            }
            #sheet.visible { transform: translateY(0); }
            #sheet-content { overflow-y: auto; overflow-x: hidden; flex: 1 1 auto; min-height: 0; -webkit-overflow-scrolling: touch; }
            .hidden { display: none !important; }
            #grabber-wrap { display: flex; justify-content: center; padding: 24px 0 34px; flex: 0 0 auto; }
            #grabber { width: 118px; height: 8px; border-radius: 4px; background: #E5E6E4; }
            .item { display: flex; align-items: center; height: 67px; padding: 0 24px; cursor: pointer; color: #4a4a4a; font-size: 18px; line-height: 1.2; -webkit-tap-highlight-color: transparent; user-select: none; }
            .item:hover { background: #F5F5F5; }
            .item:active { background: #efe9eb; }
            .item .icon { width: 32px; height: 32px; flex: 0 0 32px; color: ${SK46_APP_PINK}; margin-right: 32px; display: inline-flex; align-items: center; justify-content: center; }
            .item .icon svg { width: 100%; height: 100%; display: block; }
            .item .label { flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
            .item .title { color: #4a4a4a; font-size: 18px; line-height: 1.2; }
            .item .subtitle { color: #9E9E9E; font-size: 16px; line-height: 1.2; }
            .item .chevron { width: 24px; height: 24px; flex: 0 0 24px; margin-left: 12px; color: #9E9E9E; display: inline-flex; align-items: center; justify-content: center; }
            .item .chevron svg { width: 100%; height: 100%; display: block; }
            .item .help-btn { all: unset; width: 24px; height: 24px; flex: 0 0 24px; margin-left: 12px; color: #9E9E9E; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: color 0.15s ease, opacity 0.15s ease; }
            .item .help-btn:hover { color: #6B6B6B; }
            .item .help-btn:active { opacity: 0.55; }
            .item .help-btn svg { width: 100%; height: 100%; display: block; }
            .item.item--text-input .label { flex: 0 0 auto; margin-right: 16px; }
            .item.item--text-input .label .title { font-size: 18px; }
            .item .value-input { flex: 1 1 auto; min-width: 0; border: none; outline: none; background: transparent; text-align: right; font-size: 18px; line-height: 1.2; color: #9E9E9E; padding: 0; font-family: inherit; cursor: text; }
            .item .value-input::placeholder { color: #C7C7CC; }
            .item .value-input::selection { background: rgba(180, 160, 240, 0.45); }
            .toggle { width: 58px; height: 36px; flex: 0 0 58px; border-radius: 999px; background: #E5E6E4; position: relative; transition: background 0.2s ease; margin-left: 12px; }
            .toggle .toggle-knob { position: absolute; top: 2px; left: 2px; width: 32px; height: 32px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,.18); transition: transform 0.2s ease; }
            .toggle.on { background: ${SK46_APP_PINK}; }
            .toggle.on .toggle-knob { transform: translateX(22px); }
            .divider { height: 2px; background: #F3F3F3; margin-left: 24px; margin-right: 24px; }
            .item--danger .title { color: #c62828; }
            .item--danger.armed { background: #c62828; }
            .item--danger.armed .title, .item--danger.armed .subtitle { color: #ffffff; }
            .item--danger.armed .subtitle { opacity: 0.9; }
            #sub-header-divider { flex: 0 0 auto; }
            #sub-header { display: flex; align-items: center; gap: 12px; padding: 0; min-height: 67px; flex: 0 0 auto; background: #ffffff; }
            #btn-sub-back { all: unset; cursor: pointer; width: 67px; height: 67px; flex: 0 0 67px; border-radius: 0; display: inline-flex; align-items: center; justify-content: center; color: ${SK46_APP_PINK}; transition: opacity 0.15s ease; }
            #btn-sub-back:hover { opacity: 0.7; }
            #btn-sub-back:active { opacity: 0.45; }
            #btn-sub-back svg { width: 36px; height: 36px; display: block; }
            #sub-header .title { font-size: 24px; font-weight: 500; color: ${SK46_APP_PINK}; }
            .pick-item { padding: 16px 24px; min-height: 56px; display: flex; align-items: center; cursor: pointer; color: #4a4a4a; font-size: 17px; line-height: 1.2; user-select: none; }
            .pick-item:hover { background: #F5F5F5; }
            .pick-item:active { background: #efe9eb; }
            .pick-item.selected { color: ${SK46_APP_PINK}; font-weight: 600; }
            /* Keterangan model di baris picker (mis. kemampuan yang hilang).
               Sengaja memakai ukuran, warna, dan line-height yang PERSIS
               sama dengan .item .subtitle supaya catatan ini terbaca sebagai
               subtitle, bukan sebagai teks kecil yang menempel di-sample.
               Dipilih juga untuk ikut berubah kalau token subtitle berubah. */
            .pick-item .note { margin-left: auto; padding-left: 16px; flex: 0 0 auto; white-space: nowrap; color: #9E9E9E; font-size: 16px; line-height: 1.2; font-weight: 400; text-align: right; }
            .empty-hint { padding: 24px; color: #9E9E9E; font-size: 16px; text-align: center; word-break: break-word; }
            .item.item--disabled { opacity: .4; pointer-events: none; }
            .item.item--disabled .chevron { display: none; }
        </style>
        <div id="backdrop"></div>
        <div id="sheet" role="dialog" aria-modal="true" aria-label="Translate options">
            <div id="grabber-wrap"><div id="grabber"></div></div>
            <div id="sub-header" class="hidden">
                <button id="btn-sub-back" type="button" aria-label="Back">${SK46_ICON_BACK}</button>
                <span class="title" id="sub-header-title">Language</span>
            </div>
            <div id="sub-header-divider" class="divider hidden"></div>
            <div id="sheet-content">
                <div id="main-view">
                    <div class="item" data-key="translate-toggle">
                        <span class="icon">${SK46_ICON_TRANSLATE}</span>
                        <span class="label"><span class="title">Translate</span></span>
                        <span class="toggle" id="toggle-translate" role="switch" aria-checked="false"><span class="toggle-knob"></span></span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="language">
                        <span class="icon">${SK46_ICON_LANGUAGE}</span>
                        <span class="label">
                            <span class="title">Language</span>
                            <span class="subtitle" id="lang-subtitle">${sk46State.language}</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="provider">
                        <span class="icon">${SK46_ICON_PROVIDER}</span>
                        <span class="label">
                            <span class="title">Provider &amp; API</span>
                            <span class="subtitle">Provider, API key, Model</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="preset">
                        <span class="icon">${SK46_ICON_PRESET}</span>
                        <span class="label">
                            <span class="title">Preset</span>
                            <span class="subtitle">User preferences</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="data">
                        <span class="icon">${SK46_ICON_SHIELD}</span>
                        <span class="label">
                            <span class="title">Data &amp; privacy</span>
                            <span class="subtitle">Policy, delete data</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                </div>
                <div id="lang-view" class="hidden"><div id="lang-list">${sk46LangListHtml}</div></div>
                <div id="chat-view" class="hidden">
                    <div class="item" data-key="chat-provider-pick">
                        <span class="label">
                            <span class="title">Provider</span>
                            <span class="subtitle" id="chat-provider-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--text-input" data-key="chat-api-key">
                        <span class="label"><span class="title">API key</span></span>
                        <input type="text" id="chat-api-key-input" class="value-input" data-scope-key="chat:apiKey" placeholder="Enter API key" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off">
                        <button type="button" id="btn-chat-api-key-help" class="help-btn" aria-label="Get API key">${SK46_ICON_INFO}</button>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="chat-model-pick">
                        <span class="label">
                            <span class="title">Model</span>
                            <span class="subtitle" id="chat-model-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                </div>
                <div id="audio-view" class="hidden">
                    <div class="item" data-key="transcribe-toggle">
                        <span class="label"><span class="title">Auto-transcribe on play</span></span>
                        <span class="toggle" id="toggle-transcribe" role="switch" aria-checked="true"><span class="toggle-knob"></span></span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="audio-same-as-chat">
                        <span class="label"><span class="title">Reuse Talk provider</span></span>
                        <span class="toggle" id="toggle-audio-same-as-chat" role="switch" aria-checked="false"><span class="toggle-knob"></span></span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="audio-provider-pick">
                        <span class="label">
                            <span class="title">Provider</span>
                            <span class="subtitle" id="audio-provider-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--text-input" data-key="audio-api-key">
                        <span class="label"><span class="title">API key</span></span>
                        <input type="text" id="audio-api-key-input" class="value-input" data-scope-key="audio:apiKey" placeholder="Enter API key" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off">
                        <button type="button" id="btn-audio-api-key-help" class="help-btn" aria-label="Get API key">${SK46_ICON_INFO}</button>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="audio-model-pick">
                        <span class="label">
                            <span class="title">Model</span>
                            <span class="subtitle" id="audio-model-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                </div>
                <div id="audio-provider-list-view" class="hidden"><div id="audio-provider-list"></div></div>
                <div id="audio-model-list-view" class="hidden"><div id="audio-model-list"></div></div>
                <div id="provider-view" class="hidden">
                    <div class="item" data-key="provider-chat">
                        <span class="label">
                            <span class="title">Talk</span>
                            <span class="subtitle" id="provider-chat-subtitle">Text translation</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="provider-audio">
                        <span class="label">
                            <span class="title">Call</span>
                            <span class="subtitle">Voice message transcription</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                </div>
                <div id="provider-detail-view" class="hidden">
                    <div class="item" data-key="provider-pick">
                        <span class="label">
                            <span class="title">Provider</span>
                            <span class="subtitle" id="provider-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--text-input" data-key="api-key">
                        <span class="label"><span class="title">API key</span></span>
                        <input type="text" id="api-key-input" class="value-input" data-state-key="apiKey" placeholder="Enter API key" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off">
                        <button type="button" id="btn-api-key-help" class="help-btn" aria-label="Get API key">${SK46_ICON_INFO}</button>
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="model-pick">
                        <span class="label">
                            <span class="title">Model</span>
                            <span class="subtitle" id="model-subtitle">Not selected</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                </div>
                <div id="provider-list-view" class="hidden"><div id="provider-list">${sk46ProviderListHtml}</div></div>
                <div id="model-list-view" class="hidden"><div id="model-list"></div></div>
                <div id="preset-view" class="hidden">
                    <div class="item item--text-input" data-key="preset-nickname-target">
                        <span class="label"><span class="title">Nickname</span></span>
                        <input type="text" id="preset-nickname-target-input" class="value-input" data-state-key="presetNicknameTarget" placeholder="Preferred translation (empty = keep original)" autocomplete="off" spellcheck="false">
                    </div>
                    <div class="divider"></div>
                    <div class="item" data-key="preset-tone-pick">
                        <span class="label">
                            <span class="title">Tone</span>
                            <span class="subtitle" id="preset-tone-subtitle">Neutral</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--text-input" data-key="preset-instructions">
                        <span class="label"><span class="title">Instructions</span></span>
                        <input type="text" id="preset-instructions-input" class="value-input" data-state-key="presetInstructions" placeholder="Optional" autocomplete="off" spellcheck="false">
                    </div>
                </div>
                <div id="data-view" class="hidden">
                    <div class="item" data-key="privacy-doc">
                        <span class="label">
                            <span class="title">Privacy &amp; data policy</span>
                            <span class="subtitle">Opens the project's README</span>
                        </span>
                        <span class="chevron">${SK46_ICON_CHEVRON_RIGHT}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--danger" data-key="clear-data" id="clear-data-item">
                        <span class="label">
                            <span class="title">Delete all data</span>
                            <span class="subtitle">Transcripts, translations, URLs. Settings kept.</span>
                        </span>
                    </div>
                    <div class="divider"></div>
                    <div class="item item--danger" data-key="factory-reset" id="factory-reset-item">
                        <span class="label">
                            <span class="title">Reset everything</span>
                            <span class="subtitle">Also deletes your API keys and all settings.</span>
                        </span>
                    </div>
                </div>
                <div id="tone-list-view" class="hidden"><div id="tone-list"></div></div>
            </div>
        </div>
    `;
    sk46SheetShadow.innerHTML = SK46_SHEET_TEMPLATE;

    const sk46SheetBackdrop = sk46SheetShadow.getElementById('backdrop');
    const sk46SheetEl = sk46SheetShadow.getElementById('sheet');

    function sk46SetSheetVisible(on) {
        sk46SheetBackdrop.classList.toggle('visible', on);
        sk46SheetEl.classList.toggle('visible', on);
    }    const sk46SheetContentEl = sk46SheetShadow.getElementById('sheet-content');
    const sk46GrabberWrapEl = sk46SheetShadow.getElementById('grabber-wrap');
    const sk46SubHeaderEl = sk46SheetShadow.getElementById('sub-header');
    const sk46SubHeaderDividerEl = sk46SheetShadow.getElementById('sub-header-divider');
    const sk46SubHeaderTitleEl = sk46SheetShadow.getElementById('sub-header-title');
    const sk46SubBackEl = sk46SheetShadow.getElementById('btn-sub-back');
    const sk46MainViewEl = sk46SheetShadow.getElementById('main-view');
    const sk46LangViewEl = sk46SheetShadow.getElementById('lang-view');
    const sk46ProviderViewEl = sk46SheetShadow.getElementById('provider-view');
    const sk46ProviderDetailViewEl = sk46SheetShadow.getElementById('provider-detail-view');
    const sk46ChatViewEl = sk46SheetShadow.getElementById('chat-view');
    const sk46AudioViewEl = sk46SheetShadow.getElementById('audio-view');
    const sk46AudioProviderListViewEl = sk46SheetShadow.getElementById('audio-provider-list-view');
    const sk46AudioModelListViewEl = sk46SheetShadow.getElementById('audio-model-list-view');
    const sk46AudioProviderListEl = sk46SheetShadow.getElementById('audio-provider-list');
    const sk46AudioModelListEl = sk46SheetShadow.getElementById('audio-model-list');
    const sk46AudioApiKeyInputEl = sk46SheetShadow.getElementById('audio-api-key-input');
    const sk46AudioSameAsChatToggle = sk46SheetShadow.getElementById('toggle-audio-same-as-chat');
    const sk46ChatApiKeyInputEl = sk46SheetShadow.getElementById('chat-api-key-input');
    const sk46ChatApiKeyHelpBtn = sk46SheetShadow.getElementById('btn-chat-api-key-help');
    const sk46AudioApiKeyHelpBtn = sk46SheetShadow.getElementById('btn-audio-api-key-help');
    const sk46ChatProviderSubEl = sk46SheetShadow.getElementById('chat-provider-subtitle');
    const sk46ProviderChatSubEl = sk46SheetShadow.getElementById('provider-chat-subtitle');
    const sk46ChatModelSubEl = sk46SheetShadow.getElementById('chat-model-subtitle');
    const sk46ProviderListViewEl = sk46SheetShadow.getElementById('provider-list-view');
    const sk46ModelListViewEl = sk46SheetShadow.getElementById('model-list-view');
    const sk46PresetViewEl = sk46SheetShadow.getElementById('preset-view');
    const sk46ToneListViewEl = sk46SheetShadow.getElementById('tone-list-view');
    const sk46DataViewEl = sk46SheetShadow.getElementById('data-view');
    const sk46LangListEl = sk46SheetShadow.getElementById('lang-list');
    const sk46ProviderListEl = sk46SheetShadow.getElementById('provider-list');
    const sk46ModelListEl = sk46SheetShadow.getElementById('model-list');
    const sk46ToneListEl = sk46SheetShadow.getElementById('tone-list');
    const sk46LangSubEl = sk46SheetShadow.getElementById('lang-subtitle');
    const sk46ProviderSubtitleEl = sk46SheetShadow.getElementById('provider-subtitle');
    const sk46ModelSubtitleEl = sk46SheetShadow.getElementById('model-subtitle');
    const sk46PresetToneSubEl = sk46SheetShadow.getElementById('preset-tone-subtitle');
    const sk46ToggleTranslateEl = sk46SheetShadow.getElementById('toggle-translate');
    const sk46ToggleTranscribeEl = sk46SheetShadow.getElementById('toggle-transcribe');
    const sk46ApiKeyInputEl = sk46SheetShadow.getElementById('api-key-input');
    const sk46ApiKeyHelpBtn = sk46SheetShadow.getElementById('btn-api-key-help');

    function sk46Provider(id) { return SK46_PROVIDERS.find(p => p.id === id) || null; }
    function sk46ProviderLabel(id) { const p = sk46Provider(id); return p ? p.label : null; }
    function sk46Esc(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function sk46ParseResponseHeaders(raw) {
        const out = {};
        if (!raw) return out;
        for (const line of String(raw).split(/\r?\n/)) {
            const i = line.indexOf(':');
            if (i <= 0) continue;
            const k = line.slice(0, i).trim().toLowerCase();
            if (!k) continue;
            out[k] = line.slice(i + 1).trim();
        }
        return out;
    }

    function sk46GmFetch(url, options = {}) {
        const timeout = options.timeout || 20000;
        return new Promise((resolve, reject) => {
            try {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url,
                    headers: options.headers || {},
                    data: options.body || undefined,
                    timeout,
                    onload: res => resolve({
                        ok: res.status >= 200 && res.status < 300,
                        status: res.status,
                        headers: sk46ParseResponseHeaders(res.responseHeaders),
                        json: () => {
                            try { return Promise.resolve(JSON.parse(res.responseText)); }
                            catch (e) { return Promise.reject(new Error('Invalid JSON response')); }
                        },
                        text: () => Promise.resolve(res.responseText),
                    }),
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout')),
                });
            } catch (e) { reject(e); }
        });
    }

    function sk46GeminiModelRank(id) {
        if (/embed|tts|image|omni|aqa|live/i.test(id)) return 100;
        if (/^gemini-2\.0-flash$/.test(id)) return 0;
        if (/flash-lite/.test(id)) return 1;
        if (/(^|[-_.])flash([-_.]|$)/.test(id)) return 2;
        if (/^gemma/.test(id)) return 6;
        if (/pro/.test(id)) return 8;
        return 5;
    }

    async function sk46FetchGeminiModels(apiKey) {
        const res = await sk46GmFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (data.models || []).filter(m => {
            const id = String(m.name || '').replace(/^models\//, '');
            if (!id) return false;
            const supports = m.supportedGenerationMethods || [];
            if (!supports.includes('generateContent')) return false;
            if (!(id.startsWith('gemini') || id.startsWith('gemma'))) return false;
            if (['embedding', 'aqa', 'tts'].some(w => id.includes(w))) return false;
            return true;
        }).map(m => {
            const id = String(m.name || '').replace(/^models\//, '');
            return { id, name: m.displayName || id, context: m.inputTokenLimit || null };
        }).sort((a, b) => {
            const rk = sk46GeminiModelRank(a.id) - sk46GeminiModelRank(b.id);
            if (rk !== 0) return rk;
            const av = parseFloat((a.id.match(/[\d.]+/) || ['0'])[0]) || 0;
            const bv = parseFloat((b.id.match(/[\d.]+/) || ['0'])[0]) || 0;
            if (bv !== av) return bv - av;
            return a.id.localeCompare(b.id);
        });
    }

    async function sk46FetchAnthropicModels(apiKey) {
        const res = await sk46GmFetch('https://api.anthropic.com/v1/models', {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (data.data || []).filter(m => m && m.id)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .map(m => ({ id: m.id, name: m.display_name || m.id, context: null }));
    }

    async function sk46FetchOpenAICompatModels(endpoint, apiKey) {
        let url;
        try {
            const u = new URL(endpoint);
            u.pathname = u.pathname.replace(/\/chat\/completions\/?$/, '') + '/models';
            url = u.toString();
        } catch { throw new Error('Invalid endpoint URL'); }
        const res = await sk46GmFetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const excl = ['embedding', 'embed-', 'whisper', 'tts', 'dall-e', 'image', 'moderation', 'davinci', 'babbage', 'ada', 'curie', 'realtime', 'audio', 'computer-use'];
        return (data.data || []).filter(m => m && m.id && !excl.some(w => m.id.toLowerCase().includes(w)))
            .map(m => ({ id: m.id, name: m.id, context: m.context_window || m.max_context_length || m.context_length || null }))
            .sort((a, b) => a.id.localeCompare(b.id));
    }

    async function sk46FetchModelsForProvider(providerId, apiKey) {
        const prov = sk46Provider(providerId);
        if (!prov) throw new Error(`Unknown provider: ${providerId}`);
        if (!apiKey) throw new Error('Enter API key first');
        if (providerId === 'gemini') return sk46FetchGeminiModels(apiKey);
        if (providerId === 'anthropic') return sk46FetchAnthropicModels(apiKey);
        if (prov.endpoint) return sk46FetchOpenAICompatModels(prov.endpoint, apiKey);
        throw new Error('No model listing available for this provider');
    }

    const sk46ModelsCache = new Map();
    const sk46ModelFetchIds = new Map();

    function sk46ReconcileModelSelection(providerId, models) {
        const ids = (models || []).map(m => m.id);
        if (!ids.length) return null;
        const saved = (sk46State.models && sk46State.models[providerId]) || null;
        if (saved && ids.includes(saved)) {
            if (sk46State.provider === providerId) sk46State.model = saved;
            return saved;
        }
        if (saved) {
            ;
        }
        sk46SetChatModel(providerId, ids[0]);
        return ids[0];
    }

    function sk46RefreshChatModelViews() {
        sk46UpdateProviderSubtitles();
        if (sk46State.sheetView === 'model-list') sk46RenderModelList();
    }

    async function sk46LoadModelsForProvider(providerId) {
        const myFetchId = (sk46ModelFetchIds.get(providerId) || 0) + 1;
        sk46ModelFetchIds.set(providerId, myFetchId);
        const apiKey = (sk46State.apiKeys && sk46State.apiKeys[providerId]) || '';
        sk46ModelsCache.set(providerId, { status: 'loading', models: [], error: null });
        sk46RefreshChatModelViews();
        try {
            const models = await sk46FetchModelsForProvider(providerId, apiKey);
            if (sk46ModelFetchIds.get(providerId) !== myFetchId) return;
            sk46ModelsCache.set(providerId, { status: 'ok', models: models || [], error: null });
            sk46ReconcileModelSelection(providerId, models);
        } catch (e) {
            if (sk46ModelFetchIds.get(providerId) !== myFetchId) return;
            sk46ModelsCache.set(providerId, { status: 'error', models: [], error: String(e.message || e) });
        }
        sk46RefreshChatModelViews();
    }

    const sk46ApiKeyChangeTimers = new Map();
    function sk46ScheduleApiKeyChange(providerId) {
        const existing = sk46ApiKeyChangeTimers.get(providerId);
        if (existing) clearTimeout(existing);
        const t = setTimeout(() => {
            sk46ApiKeyChangeTimers.delete(providerId);
            sk46ModelsCache.delete(providerId);
            sk46ModelFetchIds.delete(providerId);
            if (sk46State.sheetView === 'model-list' && sk46State.provider === providerId) sk46RenderModelList();
            else if ((sk46State.apiKeys[providerId] || '').trim()) sk46LoadModelsForProvider(providerId);
        }, 800);
        sk46ApiKeyChangeTimers.set(providerId, t);
    }

    function sk46UpdateProviderSubtitles() {
        const provId = sk46State.provider;
        const prov = sk46Provider(provId);
        if (sk46ProviderSubtitleEl) sk46ProviderSubtitleEl.textContent = prov?.label || 'Not selected';
        if (sk46ModelSubtitleEl) sk46ModelSubtitleEl.textContent = sk46State.model || 'Not selected';
        if (sk46ApiKeyInputEl) sk46ApiKeyInputEl.placeholder = prov?.keyPlaceholder || 'Enter API key';
        if (sk46ChatApiKeyInputEl) sk46ChatApiKeyInputEl.placeholder = prov?.keyPlaceholder || 'Enter API key';
        if (sk46ProviderChatSubEl) {
            const supported = sk46SupportsStt(provId);
            sk46ProviderChatSubEl.textContent = supported ? 'Text translation' : 'Text translation · no call';
        }
    }
    function sk46UpdatePresetSubtitles() {
        if (sk46PresetToneSubEl) sk46PresetToneSubEl.textContent = sk46State.presetTone || SK46_TONE_DEFAULT;
    }
    function sk46SyncTextInputs() {
        for (const inp of sk46SheetShadow.querySelectorAll('.value-input')) {
            const key = inp.dataset.stateKey;
            if (!key) continue;
            let v;
            if (key === 'apiKey') v = (sk46State.apiKeys && sk46State.apiKeys[sk46State.provider]) || '';
            else if (key in sk46State) v = sk46State[key] || '';
            else continue;
            if (inp.value !== v) inp.value = v;
        }
    }
    function sk46RenderModelList() {
        const providerId = sk46State.provider;
        if (!providerId) { sk46ModelListEl.innerHTML = '<div class="empty-hint">Select a provider first</div>'; return; }
        const apiKey = ((sk46State.apiKeys && sk46State.apiKeys[providerId]) || '').trim();
        if (!apiKey) { sk46ModelListEl.innerHTML = '<div class="empty-hint">Enter API key first</div>'; return; }
        const cache = sk46ModelsCache.get(providerId);
        if (!cache) { sk46ModelListEl.innerHTML = '<div class="empty-hint">Loading models…</div>'; sk46LoadModelsForProvider(providerId); return; }
        if (cache.status === 'loading') { sk46ModelListEl.innerHTML = '<div class="empty-hint">Loading models…</div>'; return; }
        if (cache.status === 'error') { sk46ModelListEl.innerHTML = `<div class="empty-hint">⚠ ${sk46Esc(cache.error || 'Failed to load models')}</div>`; return; }
        const models = cache.models || [];
        if (!models.length) { sk46ModelListEl.innerHTML = '<div class="empty-hint">No models available</div>'; return; }
        sk46ModelListEl.innerHTML = models.map(m => {
            const selected = m.id === sk46State.model;
            return `<div class="pick-item model-item${selected ? ' selected' : ''}" data-model="${sk46Esc(m.id)}">${sk46Esc(m.id)}</div>`;
        }).join('');
    }
    function sk46RefreshProviderSelection() {
        for (const el of sk46ProviderListEl.querySelectorAll('.provider-item')) {
            if (el.getAttribute('data-provider') === sk46State.provider) el.classList.add('selected');
            else el.classList.remove('selected');
        }
    }
    function sk46RefreshLangSelection() {
        for (const el of sk46LangListEl.querySelectorAll('.lang-item')) {
            if (el.getAttribute('data-lang') === sk46State.language) el.classList.add('selected');
            else el.classList.remove('selected');
        }
    }
    function sk46RenderToneList() {
        sk46ToneListEl.innerHTML = SK46_TONES.map(t =>
            `<div class="pick-item tone-item${t === sk46State.presetTone ? ' selected' : ''}" data-tone="${t}">${t}</div>`
        ).join('');
    }

    const SK46_SHEET_ARM_MS = 5000;
    let sk46SheetArmedItem = null;
    let sk46SheetArmTimer = 0;

    function sk46DisarmSheetItem() {
        if (sk46SheetArmTimer) { clearTimeout(sk46SheetArmTimer); sk46SheetArmTimer = 0; }
        const item = sk46SheetArmedItem;
        if (!item) return;
        item.classList.remove('armed');
        const title = item.querySelector('.title');
        const subtitle = item.querySelector('.subtitle');
        if (title && item.dataset.sk46Title) title.textContent = item.dataset.sk46Title;
        if (subtitle && item.dataset.sk46Subtitle) subtitle.textContent = item.dataset.sk46Subtitle;
        sk46SheetArmedItem = null;
    }

    function sk46ArmSheetItem(item, armedTitle, armedSubtitle) {
        sk46DisarmSheetItem();
        const title = item.querySelector('.title');
        const subtitle = item.querySelector('.subtitle');
        if (title) { item.dataset.sk46Title = title.textContent; title.textContent = armedTitle; }
        if (subtitle) { item.dataset.sk46Subtitle = subtitle.textContent; subtitle.textContent = armedSubtitle; }
        item.classList.add('armed');
        sk46SheetArmedItem = item;
        sk46SheetArmTimer = setTimeout(sk46DisarmSheetItem, SK46_SHEET_ARM_MS);
    }

    function sk46RenderDataView() {
        sk46DisarmSheetItem();
    }

    function sk46OpenApiKeyHelpPage() {
        const prov = sk46Provider(sk46State.provider);
        if (!prov || !prov.keyUrl) { ; return; }
        try { window.open(prov.keyUrl, '_blank', 'noopener,noreferrer'); }
        catch (e) { ; }
    }

    const SK46_TRANSLATION_SYSTEM_INSTRUCTION = [
        `You are a translator for "${SK46_GROUP.label} Message" — a one-way mobile app`,
        `where fans receive short personal posts ("mobame") from ${SK46_GROUP.label} idol`,
        'members. The member writes informally and warmly, often with emoji,',
        'kaomoji, or interjections.',
        '',
        'You will receive one or more consecutive posts, each prefixed with [N].',
        'Translate each into the requested target language.',
        '',
        'OUTPUT FORMAT (STRICT):',
        '- One numbered block per input message, prefixed with the same [N] tag',
        '- Same total count, same order, no commentary, no preamble, no code fence',
        '',
        '─── LINE CONTRACT (read carefully) ───',
        'The literal token <NL> (uppercase, angle brackets) marks a line break in',
        'the source. The final consumer converts <NL> back to a real line break.',
        '',
        '1) TOTAL LINE COUNT PER [N] BLOCK MUST BE PRESERVED.',
        '   If the input block has 2 lines (1 <NL>), the output block MUST have',
        '   exactly 2 lines (1 <NL>). Never add, remove, or merge lines.',
        '',
        '2) POSITION OF <NL> MAY MOVE within a block to produce natural output.',
        '   You may shift a <NL> to a different word boundary as long as:',
        '     (a) the total line count for that [N] block stays the same, and',
        '     (b) the order of information is preserved (see INFORMATION ORDER).',
        '   This freedom exists specifically so you can avoid awkward cuts —',
        '   see the next section for the canonical case.',
        '',
        '─── TRAILING ↔ LEADING CONJUNCTION SHIFT ───',
        'Many languages place clause-linking conjunctions at the END of a clause',
        '(trailing conjunctions). Other languages place the equivalent at the',
        'START of the following clause (leading conjunctions). A word-for-word',
        'translation often leaves a conjunction STRANDED at the end of a line —',
        'which reads as unfinished or "translated".',
        '',
        'When this happens, MOVE the <NL> so the conjunction lands at the START',
        'of the next line instead. Conceptual pattern (applies to any language',
        'pair, not a specific one):',
        '',
        '    Source:  [clause A] + [trailing-conjunction] <NL> [clause B]',
        '    Awkward: [clause A] [leading-conjunction] <NL> [clause B]',
        '    Natural: [clause A] <NL> [leading-conjunction] [clause B]',
        '',
        'Both outputs have the same number of lines — only the cut point moved.',
        'If a conjunction has no natural equivalent in the target language, or',
        'moving the <NL> would distort meaning, DROP the conjunction rather than',
        'force an awkward tail. Trailing conjunctions often carry only discourse',
        'or softening meaning; dropping them is usually the lesser evil.',
        '',
        '─── NATURALNESS (highest priority after the line contract) ───',
        'The output MUST read as if a native speaker of the TARGET LANGUAGE wrote',
        'it casually, from scratch. Not as a translation of the source.',
        'Before finalizing each line, silently test it against that bar.',
        '',
        '- Translate MEANING, not grammatical form. Sources frequently use a',
        '  noun-phrase where the target language would use a verb, or a participle',
        '  where the target language needs a full clause. Rephrase to what the',
        '  member is ACTUALLY saying, not the grammatical shape of the source.',
        '- Do NOT add target-language adverbs, aspect markers, intensifiers,',
        '  emotional modifiers, or filler words that were not in the source.',
        '  You may add grammar the target language genuinely requires (particles,',
        '  copulas, articles, required prepositions). Nothing beyond that.',
        '- Preserve the ORDER of information: time before action; greeting before',
        '  message; subject before comment. Reorder a clause only when the target',
        '  language truly cannot express the meaning in source order.',
        '- Match the source\'s register and emotion. Casual is the default for',
        '  mobame; do not upgrade to literary or formal prose.',
        '- Discourse particles (e.g. tag-like particles, sentence-final particles,',
        '  softeners) have no 1-to-1 equivalent. Convey their MOOD (softening,',
        '  seeking agreement, self-talk, wondering aloud) — or drop them if the',
        '  target language has no natural carrier. Never insert a target-language',
        '  filler word just to represent a source particle.',
        '- Batch continuity: consecutive posts come from the same person. Keep',
        '  voice, pronouns, names, and terminology consistent across the batch.',
        '',
        '─── PRESERVE EXACTLY (byte-for-byte, do not translate) ───',
        '- All emoji and kaomoji',
        '- All URLs, @mentions, #hashtags, and alphanumeric codes',
        '- Tone-carrying punctuation: tilde, long-vowel mark, CJK commas and',
        '  periods, ellipses written as repeated dots or CJK ellipsis',
        '- The literal placeholder %%% if it appears (do not translate or expand)',
        '',
        '─── NEVER ───',
        '- Add translator notes, prefixes ("Translation:"), or surrounding quotes',
        '- Omit, summarize, or invent information',
        '- Change the total line count of any [N] block',
        '- Translate the %%% placeholder',
        '- Upgrade casual speech to formal prose unless explicitly requested',
        '',
        '─── FINAL CHECK before replying ───',
        '1. Each [N] block has the SAME number of lines as its input.',
        '2. No adverb/intensifier/filler was added that isn\'t in the source.',
        '3. Trailing conjunctions in the source did not become stranded at line',
        '   ends — the <NL> was moved if needed (TRAILING ↔ LEADING CONJUNCTION).',
        '4. Every line reads naturally to a native speaker of the target language.',
        '5. Emoji, kaomoji, placeholders, and codes are intact.',
        '',
        'Reply with ONLY the numbered translations.',
    ].join('\n');

    const SK46_TRANSCRIPT_SYSTEM_INSTRUCTION = [
        `You are a translator for spoken voice messages (mobame) from ${SK46_GROUP.label}`,
        'idol members, as heard in their chat app. The speech is informal and',
        'warm, often with interjections, emoji, kaomoji, or slang.',
        '',
        'You receive consecutive numbered speech contexts from ONE voice message,',
        'each prefixed with [N]. Each context is one complete spoken thought and',
        'they follow each other in time.',
        '',
        'OUTPUT FORMAT (STRICT):',
        '- Exactly one numbered translation per input context, same [N] tag',
        '- Same count, same order, one physical line per context',
        '- No commentary, no preamble, no code fence, no blank lines',
        '',
        'RULES:',
        '1. NEVER merge, split, reorder, drop, or invent a context. The [N] tags are',
        '   a machine contract; they are how the audio is aligned to the text.',
        '2. Translate each context fully and naturally. Preserve all meaning,',
        '   names, qualifiers, discourse markers, and the speaker\'s register.',
        '3. Never ADD anything the speaker did not say. In particular, do not',
        '   invent a greeting, a name, an address, or a vocative — a voice',
        '   message is one-way, so the speaker is not addressing anyone by',
        '   name. Do not add the reader\'s name even if it appears elsewhere.',
        '4. Keep numerals, dates, counts, and measurements as digits as spoken.',
        '5. Keep emoji, kaomoji, placeholders, and codes intact.',
        '6. Each line must read as natural speech in the target language, not as a',
        '   literal rendering of the source.',
        '7. If a source context is empty or unintelligible, still return its tag',
        '   with an empty translation rather than dropping the line.',
        '',
        'Reply with ONLY the numbered translations.',
    ].join('\n');

    const SK46_TRANSLATION_STORE_KEY = sk46GroupKey('translations');
    
    const SK46_TRANSLATION_STORE_MAX_ENTRIES = 1500;

    const SK46_BATCH_MAX_ITEMS = 25;
    const SK46_BATCH_MAX_CHARS = 3600;

    const SK46_BATCH_URGENT_ITEMS = 8;

    const SK46_PROVIDER_QUOTAS = {
        gemini:     { rpm: 10,  rpd: 250,   tpm: 250000,   tpd: 1000000,  items: 25, chars: 3600 },
        groq:       { rpm: 30,  rpd: 1000,  tpm: 8000,     tpd: 200000,   items: 12, chars: 1600 },
        cerebras:   { rpm: 30,  rpd: 6000,  tpm: 60000,    tpd: 1000000,  items: 25, chars: 3600 },
        openrouter: { rpm: 20,  rpd: 50,    tpm: 100000,   tpd: 1000000,  items: 20, chars: 2800 },
        deepseek:   { rpm: 30,  rpd: 6000,  tpm: 1000000,  tpd: 20000000, items: 25, chars: 3600 },
        openai:     { rpm: 60,  rpd: 10000, tpm: 2000000,  tpd: 20000000, items: 25, chars: 3600 },
        anthropic:  { rpm: 50,  rpd: 10000, tpm: 800000,   tpd: 20000000, items: 25, chars: 3600 },
    };

    const SK46_GEMINI_QUOTA_OVERRIDES = [
        { re: /^gemini-2\.0-flash$/, rpm: 15, rpd: 1500 },
        { re: /flash-lite/,          rpm: 15, rpd: 1000 },
    ];

    const SK46_AIMD_MIN_FACTOR = 0.1;
    const SK46_AIMD_MIN_BATCH_SCALE = 0.4;

    const sk46TranslationCache = new Map();
    const sk46TranslationInFlight = new Set();
    
    let sk46TranslationPersistTimer = null;
    
    let sk46TranslationBatchCounter = 0;
    let sk46TranslationLogEnabled = true;

    let sk46FlushDebounceTimer = null;
    let sk46FlushMaxWaitTimer = null;
    let sk46FlushPendingSnapshot = '';
    const SK46_FLUSH_DEBOUNCE_MS = 1500;
    const SK46_FLUSH_MAX_WAIT_MS = 3500;

    const sk46TranslationStats = {
        batchesStarted: 0,
        batchesSucceeded: 0,
        batchesFailed: 0,
        itemsTranslated: 0,
        cacheHits: 0,
        cacheMisses: 0,
        rebuilds: 0,
        entriesSeen: 0,
        entriesTranslatedAtBuild: 0,
        flushDebounced: 0,
        flushForced: 0,
        settingsRefreshFromCache: 0,
        requestsSent: 0,
        batchesSplit: 0,
        throttles: 0,
    };

    const SK46_TRACE_MAX = 500;
    const sk46AudioTrace = [];
    let sk46TraceRun = 0;

    function sk46Trace(stage, data) {
        const entry = Object.assign({ at: Date.now(), run: sk46TraceRun, stage: stage }, data || {});
        sk46AudioTrace.push(entry);
        if (sk46AudioTrace.length > SK46_TRACE_MAX) sk46AudioTrace.shift();
        const tag = 'color:#22d3ee;font-weight:bold';
        ;
        return entry;
    }

    function sk46TraceUrlInfo(url) {
        if (!url) return null;
        let host = '', file = '', expiresMin = null, fresh = null;
        try {
            const u = new URL(url);
            host = u.host;
            file = decodeURIComponent(u.pathname.split('/').pop() || '');
            const exp = u.searchParams.get('Expires');
            if (exp) {
                const ms = Number(exp) * 1000;
                expiresMin = Math.round((ms - Date.now()) / 60000);
                fresh = ms > Date.now();
            }
        } catch { return { raw: String(url).slice(0, 80) }; }
        return { file, host, expiresMin, fresh };
    }
    
    function sk46HashStr(text) {
        let h = 0x811c9dc5;
        const s = String(text || '');
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h.toString(36);
    }

    function sk46NormalizeSource(text) {
        return String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function sk46EncodeLineBreaks(text) {
        return String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/\n/g, ' <NL> ');
    }

    function sk46DecodeLineBreaks(text) {
        let s = String(text || '').replace(/\s*\r?\n\s*/g, ' ');
        s = s.replace(/\s*<\s*NL\s*>\s*/gi, '\n');
        return s;
    }

    function sk46TranslationFingerprint() {
        return [
            String(sk46State.language || ''),
            String(sk46State.presetTone || ''),
            String(sk46State.presetNickname || ''),
            String(sk46State.presetNicknameTarget || ''),
            String(sk46State.presetInstructions || ''),
        ].join('\u0000');
    }

    function sk46TranslationCacheKey(sourceText) {
        return sk46HashStr(sk46NormalizeSource(sourceText) + '\u0001' + sk46TranslationFingerprint());
    }

    function sk46LoadPersistentTranslations() {
        let raw;
        try { raw = sk46GmGet(SK46_TRANSLATION_STORE_KEY, null); } catch { return 0; }
        if (!raw) return 0;
        let obj;
        try { obj = (typeof raw === 'string') ? JSON.parse(raw) : raw; } catch { return 0; }
        if (!obj || typeof obj !== 'object') return 0;
        let loaded = 0;
        for (const [key, entry] of Object.entries(obj)) {
            if (!entry || typeof entry !== 'object') continue;
            if (!entry.txt) continue;
            if (sk46TranslationCache.has(key)) continue;
            sk46TranslationCache.set(key, {
                status: 'done', source: null, translated: String(entry.txt),
                error: null, ts: Number(entry.ts) || Date.now(),
            });
            loaded++;
        }
        return loaded;
    }

    function sk46PersistTranslationsNow() {
        try {
            const fp = sk46TranslationFingerprint();
            const entries = [];
            for (const [key, val] of sk46TranslationCache.entries()) {
                if (!val || val.status !== 'done' || !val.translated) continue;
                entries.push([key, val]);
            }
            entries.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
            const cap = entries.slice(0, SK46_TRANSLATION_STORE_MAX_ENTRIES);
            const out = {};
            
            for (const [key, val] of cap) out[key] = { txt: val.translated, ts: val.ts || Date.now() };
            sk46GmSet(SK46_TRANSLATION_STORE_KEY, JSON.stringify(out));
            ;
        } catch (e) { ; }
    }

    function sk46SchedulePersistTranslations() {
        if (sk46TranslationPersistTimer) return;
        sk46TranslationPersistTimer = setTimeout(() => {
            sk46TranslationPersistTimer = null;
            sk46PersistTranslationsNow();
        }, 1200);
    }

    function sk46BuildStylePromptParts(sources, opts) {
        const suppressNickname = !!(opts && opts.suppressNickname);
        const targetLanguage = String(sk46State.language || 'English');
        const tone = String(sk46State.presetTone || SK46_TONE_DEFAULT);
        const nickname = suppressNickname ? '' : String(sk46State.presetNickname || '').trim();
        const nicknameTarget = suppressNickname ? '' : String(sk46State.presetNicknameTarget || '').trim();
        const userInstructions = String(sk46State.presetInstructions || '').trim();

        const parts = [];
        parts.push(`Target language: ${targetLanguage}`);
        parts.push(`Tone preference: ${tone}`);
        {
            const toneGuides = {
                'Neutral': 'Use a balanced, neutral register, neither stiff nor overly casual. Preserve the member\'s warmth without adding slang.',
                'Formal': 'Use formal, respectful language appropriate for a public message, polite but not cold.',
                'Casual': 'Use casual, friendly, everyday language, as if the member were speaking to a close friend. Contractions and colloquialisms are welcome.',
                'Polite': 'Use polite, courteous language, respectful and considerate but not distant.',
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
                ].join('\n'),
            };
            if (toneGuides[tone]) {
                parts.push(`Tone guidance (subordinate to naturalness, so prioritise naturalness if applying it would produce awkward output): ${toneGuides[tone]}`);
            }
        }

        const rawSender = sk46CurrentChatMember();
        const sender = rawSender ? rawSender.replace(/\s+/g, ' ').trim() : '';
        const groupLabel = (SK46_GROUP && SK46_GROUP.label) || 'Sakamichi';
        if (sender) {
            parts.push(`Current message sender: ${sender} (${groupLabel} member)`);
            parts.push(`Self-reference rule: The sender frequently refers to herself in the third person using her own name or nickname (e.g. "${sender}は..."). In ${targetLanguage}, translate such self-references using first-person pronouns ("I", "me", "aku", etc.) rather than third-person.`);
        }

        const groupRoster = SK46_GROUP_MEMBERS && SK46_GROUP && SK46_GROUP_MEMBERS[SK46_GROUP.id];
        if (groupRoster && groupRoster.length > 0) {
            parts.push('');
            parts.push(`MEMBER NAMES & NICKNAMES RULE:`);
            parts.push(`- Names and nicknames of ${groupLabel} members are personal proper nouns. NEVER translate them as literal dictionary words (e.g. 天/Ten as sky/heaven, まつり/Matsuri as festival, ひかり/Hikari as light, おすし/Osushi as sushi).`);
            parts.push(`- Keep them in recognized Romaji or standard nicknames.`);
            parts.push(`- Reference roster for ${groupLabel}: ${groupRoster.join(', ')}.`);
        }

        const joinedSources = sources.join('\n');
        const hasPlaceholder = !suppressNickname && joinedSources.includes('%%%');

        if (nickname) {
            const outputForm = nicknameTarget || nickname;
            const isTranslation = !!nicknameTarget;

            parts.push('');
            parts.push(`NICKNAME RULE:`);
            if (isTranslation) {
                parts.push(`- The fan's nickname in the source is "${nickname}". In the output, render every occurrence of "${nickname}" as "${outputForm}".`);
            } else {
                parts.push(`- The fan's nickname in the source is "${nickname}". In the output, keep every occurrence of "${nickname}" unchanged — do not translate, romanize, or alter it.`);
            }
            parts.push(`- This rule applies only to the nickname string itself. Every other part of each message must still be translated into ${targetLanguage} as usual.`);
            if (hasPlaceholder) {
                parts.push(`- The source may also contain the literal token "%%%" — a runtime placeholder for the fan's nickname. Treat it as an occurrence of the nickname and output "${outputForm}".`);
            }
        } else if (hasPlaceholder) {
            parts.push('');
            parts.push(`- The source contains the literal token "%%%" — a runtime placeholder for the fan's nickname. Output it exactly as "%%%" (do not translate, expand, or replace it).`);
        }

        if (userInstructions) {
            parts.push('');
            
            const extra = suppressNickname
                ? 'accuracy, naturalness, the line contract, or the emoji rules'
                : 'accuracy, naturalness, the line contract, or the emoji/placeholder/nickname rules';
            parts.push('Additional instructions from the user (follow unless they conflict with ' + extra + '):\n' + userInstructions);
        }
        return { parts, targetLanguage };
    }

    function sk46BuildBatchPrompt(sources) {
        const { parts, targetLanguage } = sk46BuildStylePromptParts(sources);
        parts.push('');
        parts.push(`Input (${sources.length} consecutive post${sources.length > 1 ? 's' : ''}):`);
        for (let i = 0; i < sources.length; i++) {
            const src = sk46EncodeLineBreaks(sources[i]);
            parts.push(`[${i + 1}] ${src}`);
        }
        parts.push('');
        parts.push(`Output (${sources.length} block${sources.length > 1 ? 's' : ''}, one per input, keeping the [N] prefix). Within each block, preserve the TOTAL number of lines, but you MAY move a <NL> to a different word boundary if that makes the output read more naturally in ${targetLanguage} — including moving a trailing conjunction to the start of the next line. Every line must read as natural, casual ${targetLanguage}, not as a translation:`);
        return parts.join('\n');
    }

    function sk46RetryAfterMs(headers) {
        if (!headers) return 0;
        const raw = headers['retry-after'];
        if (!raw) return 0;
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return n * 1000;
        const at = Date.parse(raw);
        if (Number.isFinite(at)) return Math.max(0, at - Date.now());
        return 0;
    }

    async function sk46ProviderHttpError(res, providerId) {
        sk46GovernorAbsorbHeaders(sk46GovernorState(providerId), res.headers);
        let m = `HTTP ${res.status}`;
        try {
            const d = await res.json();
            if (d && d.error && d.error.message) m = `HTTP ${res.status}: ${d.error.message}`;
            else if (d && d.error && typeof d.error === 'string') m = `HTTP ${res.status}: ${d.error}`;
        } catch {}
        if (res.status === 429) m = 'QUOTA: ' + m;
        const e = new Error(m);
        e.__status = res.status;
        e.__retryAfterMs = sk46RetryAfterMs(res.headers);
        return e;
    }

    const SK46_MIN_MAX_OUTPUT_TOKENS = 2048;
    const SK46_LLM_TEMPERATURE = 0.3;
    const SK46_LLM_TIMEOUT_MS = 45000;
    async function sk46CallGeminiBatch(prompt, apiKey, model, system, maxTokens) {
        const genConfig = { maxOutputTokens: maxTokens || SK46_MIN_MAX_OUTPUT_TOKENS, temperature: SK46_LLM_TEMPERATURE };
        if (/gemini-[3-9]/.test(model)) genConfig.thinkingConfig = { thinkingLevel: 'minimal' };
        else if (/gemini-2\.[5-9]|thinking/.test(model)) genConfig.thinkingConfig = { thinkingBudget: 0 };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const body = JSON.stringify({
            system_instruction: { parts: [{ text: system || SK46_TRANSLATION_SYSTEM_INSTRUCTION }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: genConfig,
        });
        const res = await sk46GmFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body, timeout: SK46_LLM_TIMEOUT_MS,
        });
        if (!res.ok) throw await sk46ProviderHttpError(res, 'gemini');
        const data = await res.json();
        const text = (data && data.candidates && data.candidates[0]
            && data.candidates[0].content && data.candidates[0].content.parts
            && data.candidates[0].content.parts[0]
            && data.candidates[0].content.parts[0].text) || '';
        if (!text) {
            const reason = (data && data.candidates && data.candidates[0] && data.candidates[0].finishReason) || 'unknown';
            throw new Error(`Empty Gemini response (${reason})`);
        }
        return text;
    }

    async function sk46CallAnthropicBatch(prompt, apiKey, model, system, maxTokens) {
        const url = 'https://api.anthropic.com/v1/messages';
        const body = JSON.stringify({
            model, max_tokens: maxTokens || SK46_MIN_MAX_OUTPUT_TOKENS, temperature: SK46_LLM_TEMPERATURE,
            system: system || SK46_TRANSLATION_SYSTEM_INSTRUCTION,
            messages: [{ role: 'user', content: prompt }],
        });
        const res = await sk46GmFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body, timeout: SK46_LLM_TIMEOUT_MS,
        });
        if (!res.ok) throw await sk46ProviderHttpError(res, 'anthropic');
        const data = await res.json();
        const text = (data && data.content && data.content[0] && data.content[0].text) || '';
        if (!text) throw new Error('Empty Anthropic response');
        return text;
    }

    async function sk46CallOpenAICompatBatch(prompt, apiKey, model, endpoint, system, maxTokens, providerId) {
        const body = JSON.stringify({
            model,
            messages: [
                { role: 'system', content: system || SK46_TRANSLATION_SYSTEM_INSTRUCTION },
                { role: 'user', content: prompt },
            ],
            max_tokens: maxTokens || SK46_MIN_MAX_OUTPUT_TOKENS, temperature: SK46_LLM_TEMPERATURE,
        });
        const res = await sk46GmFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body, timeout: SK46_LLM_TIMEOUT_MS,
        });
        if (!res.ok) throw await sk46ProviderHttpError(res, providerId);
        const data = await res.json();
        
        const cached = data && data.usage && data.usage.prompt_tokens_details
            && data.usage.prompt_tokens_details.cached_tokens;
        if (cached) ;
        const text = (data && data.choices && data.choices[0]
            && data.choices[0].message && data.choices[0].message.content) || '';
        if (!text) throw new Error('Empty provider response');
        return text;
    }

    async function sk46CallLLMBatch(sources) {
        const providerId = String(sk46State.provider || '');
        const provider = sk46Provider(providerId);
        if (!provider) throw new Error('Provider not selected');
        const apiKey = (sk46State.apiKeys && sk46State.apiKeys[providerId]) || '';
        if (!apiKey) throw new Error('API key not configured');
        const model = String(sk46State.model || '');
        if (!model) throw new Error('Model not selected');
        const prompt = sk46BuildBatchPrompt(sources);
        const maxTokens = sk46MaxOutputTokens(sources);
        if (providerId === 'gemini') return await sk46CallGeminiBatch(prompt, apiKey, model, null, maxTokens);
        if (providerId === 'anthropic') return await sk46CallAnthropicBatch(prompt, apiKey, model, null, maxTokens);
        if (provider.endpoint) return await sk46CallOpenAICompatBatch(prompt, apiKey, model, provider.endpoint, null, maxTokens, providerId);
        throw new Error(`Provider "${providerId}" has no batch endpoint`);
    }

    async function sk46CallLLMPrompt(prompt, system, maxTokens) {
        const providerId = String(sk46State.provider || '');
        const provider = sk46Provider(providerId);
        if (!provider) throw new Error('Provider not selected');
        const apiKey = (sk46State.apiKeys && sk46State.apiKeys[providerId]) || '';
        if (!apiKey) throw new Error('API key not configured');
        const model = String(sk46State.model || '');
        if (!model) throw new Error('Model not selected');
        if (providerId === 'gemini') return await sk46CallGeminiBatch(prompt, apiKey, model, system, maxTokens);
        if (providerId === 'anthropic') return await sk46CallAnthropicBatch(prompt, apiKey, model, system, maxTokens);
        if (provider.endpoint) return await sk46CallOpenAICompatBatch(prompt, apiKey, model, provider.endpoint, system, maxTokens, providerId);
        throw new Error(`Provider "${providerId}" has no batch endpoint`);
    }

    function sk46ParseBatchResponse(raw, n) {
        const cleaned = String(raw || '').replace(/```[a-z]*\s*/gi, '').replace(/```\s*/g, '').trim();
        const rawLines = cleaned.split('\n');
        const byId = new Map();
        for (const line of rawLines) {
            const m = line.match(/^\s*\[(\d+)\]\s*(.*)$/);
            if (!m) continue;
            const id = parseInt(m[1], 10);
            if (id < 1 || id > n) continue;
            if (byId.has(id)) continue;
            byId.set(id, m[2].trim());
        }
        if (byId.size < Math.min(2, n)) {
            const nonEmpty = rawLines
                .map(l => l.replace(/^\s*\[\d+\]\s*/, '').trim())
                .filter(l => l);
            if (nonEmpty.length === n) return nonEmpty.map(sk46DecodeLineBreaks);
            if (nonEmpty.length >= Math.floor(n * 0.7)) {
                const out = nonEmpty.slice(0, n).map(sk46DecodeLineBreaks);
                while (out.length < n) out.push(null);
                return out;
            }
            return null;
        }
        const out = [];
        for (let i = 1; i <= n; i++) {
            const rawVal = byId.get(i);
            out.push(rawVal != null ? sk46DecodeLineBreaks(rawVal) : null);
        }
        return out;
    }

    const sk46GovernorStates = new Map();

    function sk46EstimateTokens(str) {
        const s = str == null ? '' : String(str);
        if (!s) return 0;
        let cjk = 0;
        for (let i = 0; i < s.length; i++) {
            const c = s.charCodeAt(i);
            if ((c >= 0x3040 && c <= 0x30ff)     
                || (c >= 0x3400 && c <= 0x9fff)   
                || (c >= 0xac00 && c <= 0xd7af)   
                || (c >= 0xf900 && c <= 0xfaff)) cjk++;
        }
        return Math.ceil(cjk + (s.length - cjk) / 3.5);
    }

    function sk46QuotaFor(providerId, model) {
        const base = SK46_PROVIDER_QUOTAS[providerId] || SK46_PROVIDER_QUOTAS.groq;
        if (providerId !== 'gemini') return { ...base };
        const id = String(model || '');
        for (const o of SK46_GEMINI_QUOTA_OVERRIDES) {
            if (o.re.test(id)) return { ...base, rpm: o.rpm, rpd: o.rpd };
        }
        return { ...base };
    }

    function sk46GovernorState(providerId) {
        const key = String(providerId || '__none__');
        let st = sk46GovernorStates.get(key);
        if (!st) {
            st = {
                chain: Promise.resolve(),
                lastStart: 0,
                
                tokBucket: 0,
                tokRefillAt: Date.now(),
                
                reqDay: [],
                tokDay: 0,
                lastPrune: 0,
                
                factor: 1,
                batchScale: 1,
                cooldownUntil: 0,
                
                headerRpd: 0,
                headerTpm: 0,
                headerTpd: 0,
                quotaHits: 0,
                okStreak: 0,
            };
            sk46GovernorStates.set(key, st);
        }
        return st;
    }

    function sk46PruneGovernor(st, now) {
        if (now - st.lastPrune < 60000) return;
        st.lastPrune = now;
        if (!st.reqDay.length) return;
        const minDay = now - 86400000;
        let cut = 0;
        while (cut < st.reqDay.length && st.reqDay[cut].t <= minDay) cut++;
        if (cut <= 0) return;
        for (let i = 0; i < cut; i++) st.tokDay -= st.reqDay[i].tokens || 0;
        st.reqDay = st.reqDay.slice(cut);
        if (st.tokDay < 0) st.tokDay = 0;
    }

    function sk46EffectiveQuota(st, quota) {
        return {
            rpm: quota.rpm,
            rpd: Math.max(quota.rpd, st.headerRpd || 0),
            tpm: Math.max(quota.tpm, st.headerTpm || 0),
            tpd: Math.max(quota.tpd, st.headerTpd || 0),
            items: quota.items,
            chars: quota.chars,
        };
    }

    function sk46MinGapMs(st, quota) {
        const rpm = Math.max(0.2, quota.rpm * Math.max(SK46_AIMD_MIN_FACTOR, st.factor));
        return 60000 / rpm;
    }

    function sk46RefillTokens(st, quota, now) {
        const perMs = quota.tpm / 60000;
        const refilled = st.tokBucket + (now - st.tokRefillAt) * perMs;
        st.tokBucket = Math.min(quota.tpm, Math.max(0, refilled));
        st.tokRefillAt = now;
    }

    function sk46AvailableTokens(st, quota, now) {
        const perMs = quota.tpm / 60000;
        return Math.max(0, st.tokBucket + (now - st.tokRefillAt) * perMs);
    }

    function sk46GovernorPlan(st, quota, tokens, now) {
        const SK46_MAX_WAIT_MS = 20 * 60 * 1000;
        const SK46_DAILY_WALLBACK_WAIT_MS = 15 * 60 * 1000;
        sk46PruneGovernor(st, now);

        let wait = Math.max(0, st.cooldownUntil - now);

        wait = Math.max(wait, sk46MinGapMs(st, quota) - (now - st.lastStart));

        const available = sk46AvailableTokens(st, quota, now);
        if (available < tokens) {
            const perMs = quota.tpm / 60000;
            wait = Math.max(wait, (tokens - available) / perMs);
        }

        const dayDry = st.reqDay.length >= quota.rpd || st.tokDay >= quota.tpd;
        if (dayDry) wait = Math.max(wait, SK46_DAILY_WALLBACK_WAIT_MS);

        return {
            wait: Math.min(wait, SK46_MAX_WAIT_MS),
            dayDry,
            dayFrac: Math.min(1,
                Math.max(st.reqDay.length / Math.max(1, quota.rpd),
                         st.tokDay / Math.max(1, quota.tpd))),
        };
    }

    function sk46GovernorCommit(st, quota, tokens, now) {
        sk46RefillTokens(st, quota, now);
        st.lastStart = now;
        st.tokBucket = Math.max(0, st.tokBucket - tokens);
        st.reqDay.push({ t: now, tokens });
        st.tokDay += tokens;
    }

    function sk46GovernorSuccess(st) {
        st.okStreak++;
        
        st.factor = Math.min(1, st.factor + 0.05);
        st.batchScale = Math.min(1, st.batchScale + 0.05);
    }

    function sk46GovernorThrottle(st, retryAfterMs) {
        st.okStreak = 0;
        st.factor = Math.max(SK46_AIMD_MIN_FACTOR, st.factor * 0.5);
        st.batchScale = Math.max(SK46_AIMD_MIN_BATCH_SCALE, st.batchScale * 0.7);
        const cool = Number.isFinite(retryAfterMs) && retryAfterMs > 0
            ? Math.min(retryAfterMs, 120000)
            : 30000 * (2 - st.factor);
        st.cooldownUntil = Math.max(st.cooldownUntil, Date.now() + cool);
        st.quotaHits++;
    }

    function sk46GovernorAbsorbHeaders(st, headers) {
        if (!headers) return;
        const num = k => {
            const v = Number(headers[k]);
            return Number.isFinite(v) && v > 0 ? v : 0;
        };
        const rpd = num('x-ratelimit-limit-requests');
        const tpm = num('x-ratelimit-limit-tokens');
        if (rpd && rpd !== st.headerRpd) { st.headerRpd = rpd; st.headerRpdSeenAt = Date.now(); }
        if (tpm && tpm !== st.headerTpm) { st.headerTpm = tpm; st.headerTpmSeenAt = Date.now(); }
        
    }

    function sk46BatchLimits(providerId, model) {
        const SK46_AIMD_MAX_BATCH_SCALE = 2;
        const quota = sk46EffectiveQuota(sk46GovernorState(providerId), sk46QuotaFor(providerId, model));
        const st = sk46GovernorState(providerId);
        const scale = Math.max(SK46_AIMD_MIN_BATCH_SCALE, Math.min(SK46_AIMD_MAX_BATCH_SCALE, st.batchScale));
        let items = Math.max(1, Math.round(quota.items * scale));
        let chars = Math.max(400, Math.round(quota.chars * scale));
        if (quota.tpd > 0 && st.tokDay / quota.tpd > 0.85) {
            items = Math.round(items * 1.8);
            chars = Math.round(chars * 1.8);
        }
        return {
            items: Math.max(1, Math.min(items, SK46_BATCH_MAX_ITEMS * 2)),
            chars: Math.max(400, Math.min(chars, SK46_BATCH_MAX_CHARS * 2)),
            quota,
        };
    }

    function sk46EnqueueProviderCall(providerId, task, estTokens) {
        const SK46_DEFAULT_CALL_TOKENS = 4000;
        const st = sk46GovernorState(providerId);
        const tokens = Number.isFinite(estTokens) && estTokens > 0
            ? Math.ceil(estTokens) : SK46_DEFAULT_CALL_TOKENS;
        const run = st.chain.then(async () => {
            const quota = sk46EffectiveQuota(
                st,
                sk46QuotaFor(providerId, sk46State.model),
            );
            const plan = sk46GovernorPlan(st, quota, tokens, Date.now());
            if (plan.wait > 0) {
                ;
                await new Promise(r => setTimeout(r, plan.wait));
            }
            sk46GovernorCommit(st, quota, tokens, Date.now());
            sk46TranslationStats.requestsSent++;
            return await task();
        });
        st.chain = run.catch(() => {});
        return run;
    }

    function sk46GovernorCall(providerId, task, estTokens) {
        return sk46EnqueueProviderCall(providerId, task, estTokens).then(
            r => { sk46GovernorSuccess(sk46GovernorState(providerId)); return r; },
            e => {
                const msg = String(e && e.message || e);
                if (/QUOTA|HTTP 429|rate.?limit|RESOURCE_EXHAUSTED/i.test(msg)) {
                    const retryAfter = sk46ExtractRetryAfter(e);
                    sk46GovernorThrottle(sk46GovernorState(providerId), retryAfter);
                    sk46TranslationStats.throttles++;
                    const st = sk46GovernorState(providerId);
                    ;
                }
                throw e;
            });
    }

    function sk46IsQuotaError(err) {
        return /QUOTA|HTTP 429|rate.?limit|RESOURCE_EXHAUSTED/i.test(String(err && err.message || err));
    }

    function sk46BuildBatches(items, limits) {
        const maxItems = limits && limits.items ? limits.items : SK46_BATCH_MAX_ITEMS;
        const maxChars = limits && limits.chars ? limits.chars : SK46_BATCH_MAX_CHARS;
        const batches = [];
        let cur = [];
        let curChars = 0;
        for (const item of items) {
            const len = item.source.length;
            if (cur.length > 0 && (cur.length >= maxItems || curChars + len > maxChars)) {
                batches.push(cur);
                cur = [];
                curChars = 0;
            }
            cur.push(item);
            curChars += len;
        }
        if (cur.length) batches.push(cur);
        return batches;
    }

    function sk46EstimateCallTokens(prompt, sources) {
        let srcChars = 0;
        if (sources) for (const s of sources) srcChars += String(s).length;
        else srcChars = String(prompt || '').length;
        const system = sk46EstimateTokens(SK46_TRANSLATION_SYSTEM_INSTRUCTION);
        const input = sk46EstimateTokens(prompt);
        
        const output = Math.ceil(srcChars * 1.1 / 3.5) + 64;
        return system + input + output;
    }

    function sk46MaxOutputTokens(sources) {
        let srcChars = 0;
        for (const s of sources) srcChars += String(s).length;
        return Math.max(SK46_MIN_MAX_OUTPUT_TOKENS, Math.min(32768, Math.ceil(srcChars * 0.75) + 512));
    }

    function sk46CollectPendingItems() {
        const SK46_TRANSLATION_ERROR_RETRY_MS = 60000;
        const pendingByKey = new Map();
        for (const entry of sk46TextEntries) {
            if (!entry || !entry.mirrorEl) continue;
            const textEl = entry.mirrorEl.firstElementChild;
            if (!textEl || !textEl.classList.contains('sk46-mirror-text--preview')) continue;
            const source = entry.node.text;
            if (!source) continue;
            const key = sk46TranslationCacheKey(source);
            const cached = sk46TranslationCache.get(key);
            if (cached && cached.status === 'done' && cached.translated) continue;
            if (cached && cached.status === 'error' &&
                Date.now() - (cached.ts || 0) < SK46_TRANSLATION_ERROR_RETRY_MS) continue;
            if (sk46TranslationInFlight.has(key)) continue;
            if (pendingByKey.has(key)) continue;
            pendingByKey.set(key, source);
        }
        return pendingByKey;
    }

    function sk46FlushTranslationBatch() {
        if (!sk46State.translateEnabled) return;
        const pendingByKey = sk46CollectPendingItems();
        if (pendingByKey.size === 0) return;
        const snapshot = Array.from(pendingByKey.keys()).sort().join('|');
        if (snapshot === sk46FlushPendingSnapshot &&
            (sk46FlushDebounceTimer || sk46FlushMaxWaitTimer)) {
            return;
        }
        sk46FlushPendingSnapshot = snapshot;
        if (sk46FlushDebounceTimer) {
            clearTimeout(sk46FlushDebounceTimer);
            sk46FlushDebounceTimer = null;
        }
        if (!sk46FlushMaxWaitTimer) {
            sk46FlushMaxWaitTimer = setTimeout(() => {
                sk46FlushMaxWaitTimer = null;
                if (sk46FlushDebounceTimer) {
                    clearTimeout(sk46FlushDebounceTimer);
                    sk46FlushDebounceTimer = null;
                }
                sk46TranslationStats.flushForced++;
                ;
                sk46DoFlushBatch();
            }, SK46_FLUSH_MAX_WAIT_MS);
        }
        sk46FlushDebounceTimer = setTimeout(() => {
            sk46FlushDebounceTimer = null;
            if (sk46FlushMaxWaitTimer) {
                clearTimeout(sk46FlushMaxWaitTimer);
                sk46FlushMaxWaitTimer = null;
            }
            sk46TranslationStats.flushDebounced++;
            sk46DoFlushBatch();
        }, SK46_FLUSH_DEBOUNCE_MS);
    }

    function sk46DoFlushBatch() {
        const SK46_BATCH_URGENT_MAX_CHARS = 1200;
        sk46FlushPendingSnapshot = '';
        const pendingByKey = sk46CollectPendingItems();
        if (pendingByKey.size === 0) return;
        const items = [];
        for (const [key, source] of pendingByKey) items.push({ source, key });
        
        const n = items.length;
        const urgentCount = Math.min(SK46_BATCH_URGENT_ITEMS, n);
        const urgent = urgentCount > 0 ? items.slice(n - urgentCount) : [];
        const urgentKeys = new Set(urgent.map(it => it.key));
        const bulk = items.filter(it => !urgentKeys.has(it.key));

        const limits = sk46BatchLimits(sk46State.provider, sk46State.model);
        const totalChars = items.reduce((s, it) => s + it.source.length, 0);

        const urgentBatches = sk46BuildBatches(urgent, {
            items: SK46_BATCH_URGENT_ITEMS,
            chars: SK46_BATCH_URGENT_MAX_CHARS,
        });
        const bulkBatches = sk46BuildBatches(bulk, limits);

        ;

        for (const b of urgentBatches) sk46DispatchBatch(b, true);
        for (const b of bulkBatches) sk46DispatchBatch(b, false);
    }

    function sk46DispatchBatch(batch, isUrgent) {
        if (!batch.length) return;
        const batchId = ++sk46TranslationBatchCounter;
        const sources = batch.map(b => b.source);
        const keys = batch.map(b => b.key);
        for (const k of keys) sk46TranslationInFlight.add(k);
        sk46TranslationStats.batchesStarted++;
        const startedAt = Date.now();
        
        const fp = sk46TranslationFingerprint();
        ;
        sk46GovernorCall(sk46State.provider, async () => {
            const waitFor = Date.now() - startedAt;
            if (waitFor > 500) ;
            return await sk46CallLLMBatch(sources);
        }, sk46EstimateCallTokens(null, sources)).then(raw => {
            const duration = Date.now() - startedAt;
            const parsed = sk46ParseBatchResponse(raw, sources.length);
            if (!parsed) {
                ;
                throw new Error('Batch parse failed');
            }
            let applied = 0;
            const appliedPairs = [];
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const translated = parsed[i];
                sk46TranslationInFlight.delete(key);
                if (!translated) {
                    sk46TranslationCache.set(key, {
                        status: 'error', source: sources[i],
                        translated: null, error: 'Missing in batch response',
                        ts: Date.now(),
                    });
                    continue;
                }
                sk46TranslationCache.set(key, {
                    status: 'done', source: sources[i],
                    translated, error: null,
                    ts: Date.now(),
                });
                appliedPairs.push({ source: sources[i], translated });
                applied++;
            }
            sk46TranslationStats.batchesSucceeded++;
            sk46TranslationStats.itemsTranslated += applied;
            ;
            sk46SchedulePersistTranslations();
            
            if (appliedPairs.length && fp === sk46TranslationFingerprint()) {
                sk46ApplyTranslationBatch(appliedPairs);
            } else if (appliedPairs.length) {
                ;
            }
        }).catch(err => {
            const duration = Date.now() - startedAt;
            sk46TranslationStats.batchesFailed++;
            const msg = String(err && err.message || err);
            const isQuota = sk46IsQuotaError(err);
            ;

            if (!isQuota && !/Network error|Request timeout/i.test(msg) && batch.length > 1) {
                const mid = Math.ceil(batch.length / 2);
                ;
                sk46TranslationStats.batchesSplit++;
                for (const k of keys) sk46TranslationInFlight.delete(k);
                sk46DispatchBatch(batch.slice(0, mid), isUrgent);
                sk46DispatchBatch(batch.slice(mid), isUrgent);
                return;
            }

            for (const key of keys) {
                if (!sk46TranslationInFlight.has(key)) continue;
                sk46TranslationInFlight.delete(key);
                if (sk46TranslationCache.get(key)?.status === 'done') continue;
                sk46TranslationCache.set(key, {
                    status: 'error', source: null,
                    translated: null, error: msg,
                    ts: Date.now(),
                });
            }
        });
    }

    function sk46ExtractRetryAfter(err) {
        const ms = err && err.__retryAfterMs;
        if (Number.isFinite(ms) && ms > 0) return ms;
        return 0;
    }

    function sk46ApplyTranslationBatch(pairs) {
        if (!sk46State.translateEnabled) return;
        const normMap = new Map();
        for (const { source, translated } of pairs) {
            normMap.set(sk46NormalizeSource(source), translated);
        }
        let updated = 0;
        for (const entry of sk46TextEntries) {
            if (!entry || !entry.mirrorEl || !entry.mirrorEl.isConnected) continue;
            const nodeText = entry.node && entry.node.text;
            if (!nodeText) continue;
            const norm = sk46NormalizeSource(nodeText);
            const translated = normMap.get(norm);
            if (!translated) continue;
            const textEl = entry.mirrorEl.firstElementChild;
            if (!textEl || !textEl.classList.contains('sk46-mirror-text--preview')) continue;
            sk46ApplyTextDirection(textEl, sk46TargetLanguageIsRtl());
            if (textEl.textContent === translated) continue;
            textEl.textContent = translated;
            try { void textEl.offsetHeight; } catch {}
            updated++;
        }
        if (updated > 0) {
            for (const entry of sk46TextEntries) {
                if (!entry || !entry.mirrorEl || !entry.mirrorEl.isConnected) continue;
                const textEl = entry.mirrorEl.firstElementChild;
                if (!textEl) continue;
                try { entry.naturalHeight = textEl.getBoundingClientRect().height; } catch {}
            }
            try { sk46Reposition(); } catch (e) { ; }
            sk46ForceRepaint();
            ;
        }
    }

    let sk46TranslationRebuildTimer = null;
    const SK46_SETTINGS_CHANGE_DEBOUNCE_MS = 200;
    
    function sk46RetranscribeAudioTranslations() {
        const targets = sk46AudioEntries.filter(a => a && a.transcript);
        if (!targets.length) {
            ;
            return 0;
        }
        ;
        const run = async () => {
            let done = 0, failed = 0, skipped = 0;
            for (const e of targets) {
                const st = sk46GovernorState(sk46State.provider);
                const quota = sk46EffectiveQuota(st, sk46QuotaFor(sk46State.provider, sk46State.model));
                if (st.reqDay.length >= quota.rpd || st.tokDay >= quota.tpd) {
                    skipped = targets.length - done - failed;
                    ;
                    break;
                }
                
                e.status = 'translating';
                e.translated = null;
                e.contexts = null;
                e.translationError = null;
                sk46UpdateTranscriptBtnState(e);
                if (sk46PopupEntry === e) sk46RenderPopup(e);
                try {
                    
                    const res = await sk46TranslateTranscript(e.transcript, e.words);
                    e.translated = res.translated;
                    e.contexts = res.contexts;
                    sk46RememberTranscript(e);
                    done++;
                } catch (err) {
                    e.translationError = String(err && err.message || err);
                    failed++;
                }
                e.status = 'done';
                sk46UpdateTranscriptBtnState(e);
                if (sk46PopupEntry === e) sk46RenderPopup(e);
            }
            ;
            return done;
        };
        return run();
    }

    function sk46OnTranslationSettingsChanged() {
        if (!sk46State.preview || !sk46State.translateEnabled) return;
        clearTimeout(sk46TranslationRebuildTimer);
        sk46TranslationRebuildTimer = setTimeout(() => {
            sk46TranslationRebuildTimer = null;
            sk46FlushPendingSnapshot = '';
            if (sk46FlushDebounceTimer) {
                clearTimeout(sk46FlushDebounceTimer);
                sk46FlushDebounceTimer = null;
            }
            if (sk46FlushMaxWaitTimer) {
                clearTimeout(sk46FlushMaxWaitTimer);
                sk46FlushMaxWaitTimer = null;
            }
            ;

            let refreshed = 0;
            try { refreshed = sk46RefreshMirrorsFromCache(); } catch (e) {
                ;
            }
            if (refreshed > 0) {
                sk46TranslationStats.settingsRefreshFromCache += refreshed;
                for (const entry of sk46TextEntries) {
                    if (!entry || !entry.mirrorEl) continue;
                    const textEl = entry.mirrorEl.firstElementChild;
                    if (!textEl) continue;
                    try { entry.naturalHeight = textEl.getBoundingClientRect().height; } catch {}
                }
                try { sk46Reposition(); } catch (e) { ; }
                ;
                sk46ForceRepaint();
            }

            try { sk46FlushTranslationBatch(); } catch (e) {
                ;
            }

            try { sk46RetranscribeAudioTranslations(); } catch (e) {
                ;
            }
        }, SK46_SETTINGS_CHANGE_DEBOUNCE_MS);
    }

    function sk46ClearTranslationCache(alsoPersist = true) {
        if (sk46FlushDebounceTimer) { clearTimeout(sk46FlushDebounceTimer); sk46FlushDebounceTimer = null; }
        if (sk46FlushMaxWaitTimer) { clearTimeout(sk46FlushMaxWaitTimer); sk46FlushMaxWaitTimer = null; }
        sk46FlushPendingSnapshot = '';
        sk46TranslationCache.clear();
        sk46TranslationInFlight.clear();
        
        if (alsoPersist) {
            try { sk46GmSet(SK46_TRANSLATION_STORE_KEY, ''); } catch {}
        }
        ;
    }

    const SK46_VIEW_TITLES = {
        'language': 'Language', 'provider': 'Provider & API',
        'provider-list': 'Provider', 'model-list': 'Model',
        'preset': 'Preset', 'tone-list': 'Tone',
        'chat': 'Talk', 'audio': 'Call',
        'provider-detail': 'Provider & API',
        'audio-provider-list': 'Call provider', 'audio-model-list': 'Transcription model',
        'data': 'Data & privacy',
    };
    const SK46_VIEW_PARENT = {
        'language': 'main', 'provider': 'main',
        'provider-detail': 'provider',
        'provider-list': 'chat', 'model-list': 'chat',
        'preset': 'main', 'tone-list': 'preset',
        'chat': 'provider', 'audio': 'provider',
        'audio-provider-list': 'audio', 'audio-model-list': 'audio',
        'data': 'main',
    };

    let sk46Scope = 'chat';

    function sk46ShowView(viewName) {
        sk46State.sheetView = viewName;
        const allViews = [sk46MainViewEl, sk46LangViewEl, sk46ProviderViewEl, sk46ProviderDetailViewEl, sk46ProviderListViewEl, sk46ModelListViewEl, sk46PresetViewEl, sk46ToneListViewEl, sk46ChatViewEl, sk46AudioViewEl, sk46AudioProviderListViewEl, sk46AudioModelListViewEl, sk46DataViewEl];
        for (const v of allViews) if (v) v.classList.add('hidden');
        if (viewName === 'main') sk46MainViewEl.classList.remove('hidden');
        else if (viewName === 'language') sk46LangViewEl.classList.remove('hidden');
        else if (viewName === 'provider') sk46ProviderViewEl.classList.remove('hidden');
        else if (viewName === 'provider-detail') sk46ProviderDetailViewEl.classList.remove('hidden');
        else if (viewName === 'provider-list') sk46ProviderListViewEl.classList.remove('hidden');
        else if (viewName === 'model-list') sk46ModelListViewEl.classList.remove('hidden');
        else if (viewName === 'preset') sk46PresetViewEl.classList.remove('hidden');
        else if (viewName === 'tone-list') sk46ToneListViewEl.classList.remove('hidden');
        else if (viewName === 'chat') sk46ChatViewEl.classList.remove('hidden');
        else if (viewName === 'audio') sk46AudioViewEl.classList.remove('hidden');
        else if (viewName === 'audio-provider-list') sk46AudioProviderListViewEl.classList.remove('hidden');
        else if (viewName === 'audio-model-list') sk46AudioModelListViewEl.classList.remove('hidden');
        else if (viewName === 'data') sk46DataViewEl.classList.remove('hidden');
        if (viewName === 'main') {
            sk46SubHeaderEl.classList.add('hidden');
            sk46SubHeaderDividerEl.classList.add('hidden');
            sk46GrabberWrapEl.classList.remove('hidden');
        } else {
            sk46SubHeaderEl.classList.remove('hidden');
            sk46SubHeaderDividerEl.classList.remove('hidden');
            sk46GrabberWrapEl.classList.add('hidden');
            sk46SubHeaderTitleEl.textContent = SK46_VIEW_TITLES[viewName] || '';
        }
        if (viewName === 'language') sk46RefreshLangSelection();
        if (viewName === 'provider-list') { sk46RefreshProviderSelection(); if (sk46Scope === 'audio') sk46RenderAudioProviderList(); }
        if (viewName === 'model-list') { sk46RenderModelList(); }
        if (viewName === 'provider-detail') sk46UpdateProviderSubtitles();
        if (viewName === 'preset') { sk46UpdatePresetSubtitles(); sk46SyncTextInputs(); }
        if (viewName === 'tone-list') sk46RenderToneList();
        if (viewName === 'data') sk46RenderDataView();
        if (viewName === 'chat') { sk46Scope = 'chat'; sk46RenderChatView(); }
        if (viewName === 'audio') { sk46Scope = 'audio'; sk46RenderAudioView(); }
        if (viewName === 'provider' || viewName === 'main') {
            if (sk46ProviderChatSubEl) {
                const supported = sk46SupportsStt(sk46State.provider);
                sk46ProviderChatSubEl.textContent = supported
                    ? 'Text translation'
                    : 'Text translation · no call';
            }
        }
        if (viewName === 'audio-provider-list') { sk46Scope = 'audio'; sk46RenderAudioProviderList(); }
        if (viewName === 'audio-model-list') { sk46Scope = 'audio'; sk46RenderAudioModelList(); }
        if (sk46SheetContentEl) sk46SheetContentEl.scrollTop = 0;
    }

    function sk46RenderChatView() {
        if (!sk46ChatViewEl) return;
        const prov = sk46State.provider;
        const label = sk46ProviderLabel(prov);
        if (sk46ChatProviderSubEl) sk46ChatProviderSubEl.textContent = label;
        if (sk46ChatModelSubEl) sk46ChatModelSubEl.textContent = sk46State.model || 'Not selected';
        if (sk46ChatApiKeyInputEl) sk46ChatApiKeyInputEl.value = (sk46State.apiKeys[prov] || '');
        if (sk46AudioApiKeyInputEl) {
            const ap = sk46EffectiveAudioProvider();
            const aprov = sk46Provider(ap);
            sk46AudioApiKeyInputEl.placeholder = aprov?.keyPlaceholder || 'Enter API key';
        }
    }

    function sk46RenderAudioView() {
        if (!sk46AudioViewEl) return;
        const useChat = !!sk46State.audioUseChatProvider;
        const eff = sk46EffectiveAudioProvider();
        const supported = sk46SupportsStt(eff);
        sk46AudioSameAsChatToggle.classList.toggle('on', useChat);
        sk46AudioSameAsChatToggle.setAttribute('aria-checked', String(useChat));

        const providerRow = sk46AudioViewEl.querySelector('[data-key="audio-provider-pick"]');
        const keyRow = sk46AudioViewEl.querySelector('[data-key="audio-api-key"]');
        const modelRow = sk46AudioViewEl.querySelector('[data-key="audio-model-pick"]');
        const helpRow = sk46AudioViewEl.querySelector('.help-btn');

        const locked = useChat;
        if (providerRow) providerRow.classList.toggle('item--disabled', locked);
        if (keyRow) keyRow.classList.toggle('item--disabled', locked);

        const prov = SK46_PROVIDERS.find(p => p.id === eff);
        const providerSub = sk46AudioViewEl.querySelector('#audio-provider-subtitle');
        if (providerSub) providerSub.textContent = !supported
            ? (prov ? prov.label + ' — no call support' : 'Not supported')
            : (prov ? prov.label : 'Not selected');

        const keyInput = sk46AudioApiKeyInputEl;
        if (keyInput) keyInput.value = (sk46State.apiKeys[eff] || '');
        if (helpRow) helpRow.style.display = (prov && !locked) ? '' : 'none';

        const modelSub = sk46AudioViewEl.querySelector('#audio-model-subtitle');
        if (modelSub) {
            
            const id = sk46EffectiveAudioModel();
            const note = id ? sk46SttModelNote(eff, id) : '';
            
            modelSub.textContent = !id ? 'Not selected' : (note ? `${id} · ${note}` : id);
        }

    }

    function sk46RenderAudioProviderList() {
        if (!sk46AudioProviderListEl) return;
        const eff = sk46EffectiveAudioProvider();
        sk46AudioProviderListEl.innerHTML = SK46_PROVIDERS
            .filter(p => sk46SupportsStt(p.id))
            .map(p => `<div class="pick-item provider-item ${p.id === eff ? 'selected' : ''}" data-audio-provider="${p.id}">${p.label}</div>`)
            .join('');
    }

    function sk46RenderAudioModelList() {
        if (!sk46AudioModelListEl) return;
        const eff = sk46EffectiveAudioProvider();
        if (!sk46SupportsStt(eff)) {
            sk46AudioModelListEl.innerHTML = '<div class="empty-hint">This provider does not support transcription.</div>';
            return;
        }
        const current = sk46EffectiveAudioModel();
        const known = (SK46_STT_MODELS[eff] || []).map(m => ({ id: m.id, note: m.note || '' }));
        
        if (current && !known.some(m => m.id === current)) {
            known.unshift({ id: current, note: sk46SttModelNote(eff, current) });
        }
        sk46AudioModelListEl.innerHTML = known.map(m => {
            const sel = m.id === current;
            const note = m.note ? `<span class="note">${sk46Esc(m.note)}</span>` : '';
            return `<div class="pick-item audio-model-item${sel ? ' selected' : ''}" data-audio-model="${sk46Esc(m.id)}">${sk46Esc(m.id)}${note}</div>`;
        }).join('');
    }

    sk46ApiKeyHelpBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); sk46OpenApiKeyHelpPage(); });
    sk46ApiKeyHelpBtn.addEventListener('mousedown', (e) => e.stopPropagation());

    if (sk46ChatApiKeyHelpBtn) {
        sk46ChatApiKeyHelpBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); sk46OpenApiKeyHelpPage(); });
        sk46ChatApiKeyHelpBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    }
    if (sk46AudioApiKeyHelpBtn) {
        sk46AudioApiKeyHelpBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); sk46OpenApiKeyHelpPage(); });
        sk46AudioApiKeyHelpBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    if (sk46AudioProviderListEl) {
        sk46AudioProviderListEl.addEventListener('click', (e) => {
            const el = e.target.closest('[data-audio-provider]');
            if (!el) return;
            e.stopPropagation();
            const id = el.getAttribute('data-audio-provider');
            if (!id) return;
            sk46State.audioProvider = id;
            sk46PersistKey('audioProvider');
            
            if (!sk46State.audioModels || typeof sk46State.audioModels !== 'object') {
                sk46State.audioModels = {};
            }
            sk46State.audioModel = sk46State.audioModels[id]
                || SK46_STT_DEFAULT_MODELS[id]
                || null;
            sk46PersistKeyDebounced('audioModel', 300);
            sk46ModelsCache.delete(id);
            sk46ModelFetchIds.delete(id);
            sk46RenderAudioProviderList();
            sk46RenderAudioView();
            sk46RenderAudioModelList();
            sk46ShowView('audio');
        });
    }
    if (sk46AudioModelListEl) {
        sk46AudioModelListEl.addEventListener('click', (e) => {
            const el = e.target.closest('[data-audio-model]');
            if (!el) return;
            e.stopPropagation();
            const m = el.getAttribute('data-audio-model');
            if (!m) return;
            sk46SetAudioModel(sk46EffectiveAudioProvider(), m);
            sk46RenderAudioView();
            sk46RenderAudioModelList();
            sk46ShowView('audio');
        });
    }

    sk46SubBackEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = SK46_VIEW_PARENT[sk46State.sheetView] || 'main';
        sk46ShowView(parent);
    });

    sk46LangListEl.addEventListener('click', (e) => {
        const el = e.target.closest('.lang-item');
        if (!el) return;
        e.stopPropagation();
        const lang = el.getAttribute('data-lang');
        if (!lang) return;
        sk46SetState('language', lang);
        sk46OnTranslationSettingsChanged();
        sk46LangSubEl.textContent = lang;
        sk46RefreshLangSelection();
        sk46ShowView('main');
        ;
    });

    sk46ProviderListEl.addEventListener('click', (e) => {
        const el = e.target.closest('.provider-item');
        if (!el) return;
        e.stopPropagation();
        const id = el.getAttribute('data-provider');
        if (!id || id === sk46State.provider) { sk46ShowView('provider'); return; }
        sk46State.provider = id;
        sk46PersistKey('provider');
        
        sk46RestoreChatModel(id);
        if (sk46State.audioUseChatProvider) sk46EffectiveAudioModel();
        sk46ModelsCache.delete(id);
        sk46ModelFetchIds.delete(id);
        sk46RefreshProviderSelection();
        sk46UpdateProviderSubtitles();
        sk46SyncTextInputs();
        sk46ShowView('provider');
        const apiKey = (sk46State.apiKeys[id] || '').trim();
        
        if (apiKey) sk46LoadModelsForProvider(id);
        else sk46RefreshChatModelViews();
    });

    sk46ModelListEl.addEventListener('click', (e) => {
        const el = e.target.closest('.model-item');
        if (!el) return;
        e.stopPropagation();
        const m = el.getAttribute('data-model');
        if (!m) return;
        sk46SetChatModel(sk46State.provider, m);
        sk46UpdateProviderSubtitles();
        sk46ShowView('provider');
    });

    sk46ToneListEl.addEventListener('click', (e) => {
        const el = e.target.closest('.tone-item');
        if (!el) return;
        e.stopPropagation();
        const t = el.getAttribute('data-tone');
        if (!t) return;
        sk46SetState('presetTone', t);
        sk46OnTranslationSettingsChanged();
        sk46UpdatePresetSubtitles();
        sk46ShowView('preset');
    });

    for (const inp of sk46SheetShadow.querySelectorAll('.value-input[data-scope-key]')) {
        inp.addEventListener('input', (e) => {
            const spec = e.target.dataset.scopeKey;
            if (!spec) return;
            const [scope, key] = spec.split(':');
            if (!scope || key !== 'apiKey') return;
            if (!sk46State.apiKeys) sk46State.apiKeys = {};
            const prov = scope === 'audio' ? sk46EffectiveAudioProvider() : sk46State.provider;
            sk46State.apiKeys[prov] = e.target.value;
            sk46PersistKeyDebounced('apiKeys', 400);
            sk46ScheduleApiKeyChange(prov);
        });
        inp.addEventListener('click', (e) => e.stopPropagation());
        inp.addEventListener('mousedown', (e) => e.stopPropagation());
        inp.addEventListener('focus', (e) => e.stopPropagation());
        inp.addEventListener('blur', () => {
            const t = sk46PersistTimers.get('apiKeys');
            if (t) { clearTimeout(t); sk46PersistTimers.delete('apiKeys'); }
            sk46PersistKey('apiKeys');
        });
    }

    for (const inp of sk46SheetShadow.querySelectorAll('.value-input[data-state-key]')) {
        inp.addEventListener('input', (e) => {
            const key = e.target.dataset.stateKey;
            if (!key) return;
            if (key === 'apiKey') {
                if (!sk46State.apiKeys) sk46State.apiKeys = {};
                sk46State.apiKeys[sk46State.provider] = e.target.value;
                sk46PersistKeyDebounced('apiKeys', 400);
                sk46ScheduleApiKeyChange(sk46State.provider);
            } else if (key in sk46State) {
                sk46State[key] = e.target.value;
                sk46PersistKeyDebounced(key, 400);
                if (key === 'presetNicknameTarget' || key === 'presetInstructions') {
                    sk46OnTranslationSettingsChanged();
                }
            }
        });
        inp.addEventListener('click', (e) => e.stopPropagation());
        inp.addEventListener('mousedown', (e) => e.stopPropagation());
        inp.addEventListener('focus', (e) => e.stopPropagation());
        inp.addEventListener('blur', (e) => {
            const key = e.target.dataset.stateKey;
            if (!key) return;
            const pk = (key === 'apiKey') ? 'apiKeys' : key;
            if (SK46_PERSIST_KEYS.includes(pk)) {
                const t = sk46PersistTimers.get(pk);
                if (t) { clearTimeout(t); sk46PersistTimers.delete(pk); }
                sk46PersistKey(pk);
            }
        });
    }

    for (const item of sk46SheetShadow.querySelectorAll('.item[data-key]')) {
        item.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('value-input')) return;
            if (e.target.classList && e.target.classList.contains('help-btn')) return;
            if (e.target.closest && e.target.closest('.help-btn')) return;
            e.stopPropagation();
            const key = item.getAttribute('data-key');
            switch (key) {
                case 'language': sk46ShowView('language'); break;
                case 'provider': sk46ShowView('provider'); break;
                case 'provider-chat': sk46Scope = 'chat'; sk46ShowView('chat'); break;
                case 'provider-audio': sk46Scope = 'audio'; sk46ShowView('audio'); break;
                case 'chat-provider-pick': sk46Scope = 'chat'; sk46ShowView('provider-list'); break;
                case 'chat-model-pick': sk46Scope = 'chat'; sk46ShowView('model-list'); break;
                case 'chat-api-key': if (sk46ChatApiKeyInputEl) sk46ChatApiKeyInputEl.focus(); break;
                case 'audio-api-key': if (sk46AudioApiKeyInputEl && !sk46State.audioUseChatProvider) sk46AudioApiKeyInputEl.focus(); break;
                case 'audio-provider-pick': sk46Scope = 'audio'; sk46ShowView('audio-provider-list'); break;
                case 'audio-model-pick': sk46Scope = 'audio'; sk46ShowView('audio-model-list'); break;
                case 'audio-same-as-chat': {
                    const next = !sk46State.audioUseChatProvider;
                    const targetProvider = next ? sk46State.provider : sk46State.audioProvider;
                    if (next && !sk46SupportsStt(targetProvider)) {
                        ;
                        break;
                    }
                    sk46SetState('audioUseChatProvider', next);
                    
                    sk46EffectiveAudioModel();
                    sk46RenderAudioView();
                    sk46RenderAudioModelList();
                    break;
                }
                case 'provider-pick': sk46ShowView('provider-list'); break;
                case 'api-key': if (sk46ApiKeyInputEl) sk46ApiKeyInputEl.focus(); break;
                case 'model-pick': sk46ShowView('model-list'); break;
                case 'provider-detail': sk46ShowView('provider-detail'); break;
                case 'preset': sk46ShowView('preset'); break;
                case 'data': sk46ShowView('data'); break;
                case 'privacy-doc': {
                    
                    const url = sk46PrivacyDocUrl();
                    const win = window.open(url, '_blank', 'noopener,noreferrer');
                    if (!win) {
                        ;
                        sk46ShowView('main');
                        return;
                    }
                    ;
                    break;
                }
                case 'clear-data': {
                    if (sk46SheetArmedItem !== item) {
                        sk46ArmSheetItem(item, 'Tap again to confirm', 'Cannot be undone.');
                        break;
                    }
                    sk46DisarmSheetItem();
                    const cleared = sk46ClearEverything(false);
                    sk46ShowView('main');
                    ;
                    break;
                }
                case 'factory-reset': {
                    if (sk46SheetArmedItem !== item) {
                        sk46ArmSheetItem(item, 'Tap again to confirm', 'Your API keys will be deleted.');
                        break;
                    }
                    sk46DisarmSheetItem();
                    const reset = sk46ClearEverything(true);
                    sk46ShowView('main');
                    ;
                    break;
                }
                case 'preset-nickname': sk46FocusInputByStateKey('presetNickname'); break;
                case 'preset-nickname-target': sk46FocusInputByStateKey('presetNicknameTarget'); break;
                case 'preset-tone-pick': sk46ShowView('tone-list'); break;
                case 'preset-instructions': sk46FocusInputByStateKey('presetInstructions'); break;
                case 'translate-toggle':
                    sk46SetState('translateEnabled', !sk46State.translateEnabled);
                    sk46ApplyTranslateToggle();
                    break;
                case 'transcribe-toggle':
                    sk46SetState('autoTranscribe', !sk46State.autoTranscribe);
                    sk46ApplyTranscribeToggle();
                    break;
            }
        });
    }

    function sk46FocusInputByStateKey(stateKey) {
        const inp = sk46SheetShadow.querySelector(`.value-input[data-state-key="${stateKey}"]`);
        if (inp) inp.focus();
    }

    function sk46ApplyTranslateToggle() {
        if (!sk46ToggleTranslateEl) return;
        sk46ToggleTranslateEl.classList.toggle('on', !!sk46State.translateEnabled);
        sk46ToggleTranslateEl.setAttribute('aria-checked', String(!!sk46State.translateEnabled));
        if (sk46ToggleTranscribeEl) {
            sk46ToggleTranscribeEl.classList.toggle('on', !!sk46State.autoTranscribe);
            sk46ToggleTranscribeEl.setAttribute('aria-checked', String(!!sk46State.autoTranscribe));
        }
        if (sk46State.preview) {
            try { sk46FullRebuild(); } catch (e) { ; }
        }
    }

    function sk46ApplyStateToUI() {
        if (sk46El && sk46El.chkPreview) sk46El.chkPreview.checked = !!sk46State.preview;
        if (sk46El && sk46El.chkShowTranslate) sk46El.chkShowTranslate.checked = !!sk46State.showTranslateBtn;
        sk46ApplyTranslateToggle();
        sk46SyncTextInputs();
        sk46UpdateProviderSubtitles();
        sk46UpdatePresetSubtitles();
        if (sk46LangSubEl) sk46LangSubEl.textContent = sk46State.language;
        sk46RenderChatView();
        sk46RenderAudioView();
    }

    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!sk46State.sheetOpen) return;
        if (sk46State.sheetView === 'main') sk46CloseSheet();
        else sk46ShowView(SK46_VIEW_PARENT[sk46State.sheetView] || 'main');
    });

    function sk46FindHeaderRightButtons() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return [];

        const h2TopLimit = Math.max(150, Math.min(300, window.innerHeight * 0.35));

        const candidateRows = [];
        for (const h2 of host.querySelectorAll('h2')) {
            const h2Rect = h2.getBoundingClientRect();
            if (h2Rect.height === 0 || h2Rect.height > 60) continue;
            if (h2Rect.width < 80) continue;
            if (h2Rect.top < -20) continue;
            if (h2Rect.top > h2TopLimit) continue;

            const parent = h2.parentElement;
            if (!parent) continue;

            const h2CenterY = h2Rect.top + h2Rect.height / 2;
            const rightButtons = [];
            for (const child of parent.children) {
                if (child === h2) continue;
                if (child.tagName.toLowerCase() !== 'flt-semantics') continue;
                if (child.getAttribute('role') !== 'button') continue;
                const br = child.getBoundingClientRect();
                if (br.width < 30 || br.width > 100) continue;
                if (br.height < 30 || br.height > 100) continue;
                const brCenterY = br.top + br.height / 2;
                if (Math.abs(brCenterY - h2CenterY) > Math.max(h2Rect.height, br.height)) continue;
                if (br.left < h2Rect.left + h2Rect.width / 2) continue;
                rightButtons.push(br);
            }

            if (rightButtons.length > 0) {
                rightButtons.sort((a, b) => a.left - b.left);
                candidateRows.push({ h2Top: h2Rect.top, buttons: rightButtons });
            }
        }

        if (candidateRows.length > 0) {
            candidateRows.sort((a, b) => {
                if (b.buttons.length !== a.buttons.length) return b.buttons.length - a.buttons.length;
                return a.h2Top - b.h2Top;
            });
            return candidateRows[0].buttons;
        }

        const vw = window.innerWidth;
        const allButtons = [];
        for (const b of host.querySelectorAll('flt-semantics[role="button"]')) {
            if (b.querySelector('flt-semantics, flt-semantics-container')) continue;
            const r = b.getBoundingClientRect();
            if (r.top < -20 || r.top > h2TopLimit) continue;
            if (r.width < 30 || r.width > 100) continue;
            if (r.height < 30 || r.height > 100) continue;
            if (r.right < vw * 0.5) continue;
            allButtons.push(r);
        }

        const clusters = [];
        for (const r of allButtons) {
            const cy = r.top + r.height / 2;
            let cluster = clusters.find(c => Math.abs(c.centerY - cy) < 15);
            if (!cluster) {
                cluster = { centerY: cy, top: r.top, buttons: [] };
                clusters.push(cluster);
            }
            cluster.buttons.push(r);
            cluster.centerY = cluster.buttons.reduce((s, b) => s + (b.top + b.height / 2), 0) / cluster.buttons.length;
            if (r.top < cluster.top) cluster.top = r.top;
        }
        if (clusters.length === 0) return [];

        clusters.sort((a, b) => a.top - b.top);
        const multiButtonCluster = clusters.find(c => c.buttons.length >= 2);
        const chosen = multiButtonCluster || clusters[0];
        chosen.buttons.sort((a, b) => a.left - b.left);
        return chosen.buttons;
    }

    function sk46GetAppViewportRect() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return null;
        const iw = window.innerWidth, ih = window.innerHeight;
        let best = null, bestArea = 0;
        for (const child of host.children) {
            const tag = child.tagName.toLowerCase();
            if (tag !== 'flt-semantics' && tag !== 'flt-semantics-container') continue;
            const r = child.getBoundingClientRect();
            if (r.width < 150) continue;
            // Mobile: allow full-width containers (ratio 1.05)
            if (r.width > iw * SK46_VIEWPORT_FILL_RATIO) continue;
            if (r.height < ih * 0.3) continue;
            const area = r.width * r.height;
            if (area > bestArea) { best = r; bestArea = area; }
        }
        if (best) return best;
        for (const h2 of host.querySelectorAll('h2')) {
            const h2Rect = h2.getBoundingClientRect();
            if (h2Rect.top < 0 || h2Rect.top > 100) continue;
            if (h2Rect.width === 0 || h2Rect.width > 400) continue;
            if (h2Rect.height === 0 || h2Rect.height > 60) continue;
            let p = h2.parentElement;
            while (p && p !== host && p !== document.body) {
                const pr = p.getBoundingClientRect();
                if (pr.width >= 150 && pr.width < iw * SK46_VIEWPORT_FILL_RATIO && pr.height > ih * 0.3) {
                    const area = pr.width * pr.height;
                    if (area > bestArea) { best = pr; bestArea = area; }
                }
                p = p.parentElement;
            }
            if (best) return best;
        }
        const fv = document.querySelector('flutter-view');
        if (fv) {
            const r = fv.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) return r;
        }
        // Final fallback: return full viewport rect for mobile
        return { left: 0, top: 0, right: iw, bottom: ih, width: iw, height: ih };
    }

    function sk46TranslateBtnAllowedHere() {
        return sk46PageKind === 'chat' || sk46IsTalkHubPage();
    }

    function sk46PositionTranslateBtn() {
        if (!sk46State.showTranslateBtn) { sk46TranslateBtn.style.display = 'none'; return; }
        if (!sk46TranslateBtnAllowedHere()) { sk46TranslateBtn.style.display = 'none'; return; }

        const onHub = sk46IsTalkHubPage();
        const rightBtns = sk46FindHeaderRightButtons();

        if ((onHub || sk46GetHeaderRowBounds()) && rightBtns.length > 0) {
            const envelopeRect = rightBtns[0];
            const btnSize = envelopeRect.height;
            if (btnSize > 0) {
                sk46TranslateBtn.classList.remove('sk46-fab-fallback');
                sk46TranslateBtn.style.display = 'flex';
                sk46TranslateBtn.style.left = (envelopeRect.left - btnSize) + 'px';
                sk46TranslateBtn.style.top = envelopeRect.top + 'px';
                sk46TranslateBtn.style.width = btnSize + 'px';
                sk46TranslateBtn.style.height = btnSize + 'px';
                sk46TranslateBtn.style.right = '';
                sk46TranslateBtn.style.bottom = '';
                return;
            }
        }

        // FAB fallback: header not found or too narrow, float at bottom-right
        sk46TranslateBtn.classList.add('sk46-fab-fallback');
        sk46TranslateBtn.style.display = 'flex';
        sk46TranslateBtn.style.left = '';
        sk46TranslateBtn.style.top = '';
        sk46TranslateBtn.style.width = '';
        sk46TranslateBtn.style.height = '';
    }

    function sk46PositionSheet() {
        const appRect = sk46GetAppViewportRect();
        if (appRect) {
            const leftPx = appRect.left + 'px';
            const rightPx = (window.innerWidth - appRect.right) + 'px';
            sk46SheetEl.style.left = leftPx;
            sk46SheetEl.style.right = rightPx;
            sk46SheetBackdrop.style.inset = '';
            sk46SheetBackdrop.style.left = leftPx;
            sk46SheetBackdrop.style.right = rightPx;
            sk46SheetBackdrop.style.top = appRect.top + 'px';
            sk46SheetBackdrop.style.bottom = (window.innerHeight - appRect.bottom) + 'px';
        } else {
            sk46SheetEl.style.left = '0px';
            sk46SheetEl.style.right = '0px';
            sk46SheetBackdrop.style.inset = '0';
            sk46SheetBackdrop.style.left = '';
            sk46SheetBackdrop.style.right = '';
            sk46SheetBackdrop.style.top = '';
            sk46SheetBackdrop.style.bottom = '';
        }
    }

    function sk46OpenSheet() {
        
        if (!sk46State.showTranslateBtn) {
            ;
            return;
        }
        if (sk46State.sheetOpen) return;
        sk46PositionSheet();
        sk46ShowView('main');
        sk46ApplyStateToUI();
        sk46State.sheetOpen = true;
        sk46SetSheetVisible(true);
        requestAnimationFrame(() => {
            try { sk46ForceRepaint(); } catch {}
        });
        setTimeout(() => {
            if (!sk46State.sheetOpen) return;
            try { sk46ForceRepaint(); } catch {}
        }, 260);
    }
    function sk46CloseSheet() {
        if (!sk46State.sheetOpen) return;
        sk46State.sheetOpen = false;
        
        try { sk46DisarmSheetItem(); } catch {}
        sk46SetSheetVisible(false);
        requestAnimationFrame(() => {
            try { sk46ForceRepaint(); } catch {}
        });
        setTimeout(() => {
            if (sk46State.sheetOpen) return;
            try { sk46ForceRepaint(); } catch {}
        }, 260);
    }

    sk46TranslateBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (sk46State.sheetOpen) sk46CloseSheet();
        else sk46OpenSheet();
    });
    sk46SheetBackdrop.addEventListener('click', () => sk46CloseSheet());

    function sk46ResetPersisted() {
        const defaults = {
            preview: true, textTopPadPx: 14, pictureCaptionBiasPx: -8,
            mirrorRightPadExtraPx: 5,
            mirrorBgBleedTopPx: 10, mirrorBgBleedRightPx: 30,
            mirrorBgBleedBottomPx: 10, mirrorBgBleedLeftPx: 24.5,
            skipUnreadButtons: true, maskFloatingButtons: true,
            showTranslateBtn: true, translateEnabled: false,
            language: 'English', provider: 'gemini',
            apiKeys: {}, model: null,
            presetNickname: '', presetNicknameTarget: '',
            presetTone: 'Neutral', presetInstructions: '',
            autoTranscribe: true, audioUseChatProvider: true,
            audioProvider: 'gemini', audioModel: null,
        };
        for (const key of SK46_PERSIST_KEYS) {
            sk46State[key] = defaults[key];
            sk46PersistKey(key);
        }
        sk46ModelsCache.clear();
        sk46ModelFetchIds.clear();
        sk46ClearTranslationCache(true);
        sk46ApplyStateToUI();
        ;
    }

    const SK46_DURATION_RE = /^\d{1,2}:\d{2}(?:\.\d+)?$/;
    
    const SK46_DURATION_PENDING = /^--:--$/;

    function sk46IsAudioSlider(node) {
        if (!node) return false;
        const tag = node.tagName ? node.tagName.toLowerCase() : '';
        if (tag === 'input' && node.type === 'range') return true;
        if (node.getAttribute && node.getAttribute('aria-owns') !== null) return true;
        if (tag === 'input' || tag === 'flt-semantics' || tag === 'flt-semantics-container') {
            const t = (node.textContent || '').trim();
            if (/^\d{1,3}%$/.test(t)) return true;
        }
        return false;
    }

    function sk46GroupHasAudioSlider(group) {
        for (const node of group.querySelectorAll('flt-semantics, input')) {
            if (sk46IsAudioSlider(node)) return true;
        }
        return false;
    }
    
    const SK46_MEDIA_URL_TTL_MS = 5 * 60 * 1000;
    const SK46_HISTORY_KEY = sk46GroupKey('audioHistory');
    
    const SK46_TRANSCRIPT_STORE_KEY = sk46GroupKey('audioTranscripts');
    const sk46MediaUrls = new Map();
    let sk46MediaUrlHooked = false;
    let sk46MediaUrlRestores = [];
    let sk46MediaUrlObserved = false;
    let sk46MediaUrlObserver = null;
    const SK46_AUDIO_EXT_RE = /\.(m4a|mp3|aac|wav|ogg|oga|opus|flac|webm)$/i;
    const SK46_MEDIA_PATH_RE = /\/private\/messages\//;

    function sk46IsAudioGroupLabel(label) {
        const s = String(label || '').trim();
        return SK46_DURATION_RE.test(s) || SK46_DURATION_PENDING.test(s);
    }

    function sk46FindAudioBubbles() {
        const host = document.querySelector(SK46_FLUTTER_HOST);
        if (!host) return [];
        return Array.from(host.querySelectorAll('flt-semantics[role="group"][aria-label]'))
            .filter(el => sk46IsAudioGroupLabel(el.getAttribute('aria-label')))
            .map(el => {
                const playBtn = el.querySelector('flt-semantics[role="button"][flt-tappable]');
                const slider = Array.from(el.querySelectorAll('flt-semantics, input'))
                    .find(n => sk46IsAudioSlider(n)) || null;
                return { el, duration: (el.getAttribute('aria-label') || '').trim(), playBtn, slider };
            });
    }

    function sk46AudioFileFromUrl(url) {
        try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || ''); }
        catch { return ''; }
    }

    function sk46UrlExpiresMs(url) {
        try {
            const v = new URL(url).searchParams.get('Expires');
            return v ? Number(v) * 1000 : null;
        } catch { return null; }
    }

    function sk46IsUrlFresh(url) {
        const exp = sk46UrlExpiresMs(url);
        if (!exp) return true;
        return Date.now() < exp - 10000;
    }

    function sk46AudioKeyForFile(file) {
        const base = String(file || '').replace(SK46_AUDIO_EXT_RE, '').replace(/\.0000000$/, '');
        const parts = base.split('-');
        if (parts.length >= 2) return parts[0];
        return base;
    }

    function sk46RecordMediaUrl(url, sourceEl) {
        if (!url || !SK46_MEDIA_PATH_RE.test(url)) return;
        const file = sk46AudioFileFromUrl(url);
        if (!SK46_AUDIO_EXT_RE.test(file)) return;
        const expiresAt = sk46UrlExpiresMs(url);
        const key = sk46AudioKeyForFile(file);
        const prev = sk46MediaUrls.get(key);
        if (prev && prev.url === url) {
            prev.seenAt = Date.now();
            prev.expiresAt = expiresAt;
            return;
        }
        if (expiresAt && Date.now() > expiresAt) {
            sk46MediaUrls.set(key, { key, file, url, seenAt: Date.now(), expiresAt, sourceEl: sourceEl || null, stale: true });
            return;
        }
        sk46MediaUrls.set(key, { key, file, url, seenAt: Date.now(), expiresAt, sourceEl: sourceEl || null, stale: false });
        if (sk46MediaUrlOnSrc) sk46MediaUrlOnSrc(url, sourceEl);
;
    sk46Trace('url:recorded', {
        file,
        url: sk46TraceUrlInfo(url),
        expired: !!(expiresAt && Date.now() > expiresAt),
    });
    
    const waiting = sk46AudioEntries.filter(e => {
        if (!e.el || !e.el.isConnected) return false;
        if (!e.waitingForUrl && e.status !== 'transcribing') return false;
        if (e.url && sk46IsUrlFresh(e.url)) return false;
        return true;
    });
    
    const expected = sk46TakeExpectedPlayback(file);
    const candidates = waiting.length
        ? waiting
        : (expected ? [expected] : sk46AudioEntries.filter(e =>
            sk46PopupEntry === e && e.el && e.el.isConnected && !(e.url && sk46IsUrlFresh(e.url))));
    if (candidates.length === 1) {
        const e = candidates[0];
        sk46BindAudioUrl(e, url, file);
        sk46Trace('url:bound', {
            file, to: e.anchorKey,
            how: waiting.length ? 'single-waiting' : (expected ? 'just-played' : 'popup-entry'),
        });
        ;
        sk46ResolveWaitingForUrl(e);
    } else if (candidates.length > 1) {
        const byDate = candidates.filter(e => sk46FileDateMatchesLabel(file, e.msgLabel));
        if (byDate.length === 1) {
            const e = byDate[0];
            sk46BindAudioUrl(e, url, file);
            sk46Trace('url:bound', { file, to: e.anchorKey, how: 'matched-by-date', candidates: candidates.length });
            ;
            sk46ResolveWaitingForUrl(e);
        } else {
            sk46Trace('url:unbound', { file, candidates: candidates.length, dateMatches: byDate.length });
            ;
        }
    } else {
        sk46Trace('url:unbound', { file, candidates: 0 });
    }
  }

    function sk46FindFreshUrlForFile(fileKey) {
        if (!fileKey) return null;
        const rec = sk46MediaUrls.get(fileKey);
        if (!rec) return null;
        if (rec.expiresAt && Date.now() >= rec.expiresAt) return null;
        if (!rec.expiresAt && Date.now() - rec.seenAt > SK46_MEDIA_URL_TTL_MS) return null;
        return rec;
    }

    function sk46StaleUrlHint(fileKey) {
        const rec = fileKey ? sk46MediaUrls.get(fileKey) : null;
        if (!rec || !rec.stale) return '';
        const left = rec.expiresAt ? Math.round((rec.expiresAt - Date.now()) / 60000) : 0;
        return left > 0
            ? ` Signed URL expires in ~${left} min.`
            : ' Signed URL has expired.';
    }

    let sk46OutsideClickInstalled = false;

    function sk46InstallOutsideClickClose() {
        if (sk46OutsideClickInstalled) return;
        sk46OutsideClickInstalled = true;
        document.addEventListener('pointerdown', (e) => {
            if (!sk46PopupEntry) return;
            let path;
            try { path = e.composedPath(); } catch { path = []; }
            if (path && path.indexOf(sk46PopupHost) !== -1) return;
            const t = e.target;
            const bubbleEl = sk46PopupEntry.el;
            if (t && bubbleEl && bubbleEl.contains && bubbleEl.contains(t)) return;
            if (t && t.closest && t.closest('.sk46-transcript-btn')) return;
            sk46ClosePopup();
        }, true);
    }

    function sk46InstallMediaUrlObserver() {
        if (sk46MediaUrlObserved) return;
        if (typeof PerformanceObserver === 'undefined') {
            ;
            return;
        }
        sk46MediaUrlObserved = true;

        const consider = (name) => {
            try {
                if (!name) return;
                if (!SK46_MEDIA_PATH_RE.test(name)) return;
                if (!SK46_AUDIO_EXT_RE.test(sk46AudioFileFromUrl(name))) return;
                sk46RecordMediaUrl(name, null);
            } catch (e) {
                ;
            }
        };

        try {
            sk46MediaUrlObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) consider(entry.name);
            });
            
            sk46MediaUrlObserver.observe({ type: 'resource', buffered: true });
        } catch (e) {
            sk46MediaUrlObserved = false;
            ;
            return;
        }

        for (const r of sk46CollectMediaResources()) {
            if (r.audioExt) consider(r.url);
        }
    }

    function sk46TrackMediaElement() {
        if (sk46MediaUrlHooked) return;
        const pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const proto = pageWindow && pageWindow.HTMLMediaElement ? pageWindow.HTMLMediaElement.prototype : null;
        if (!proto) {
            ;
            return;
        }
        const origPlay = proto.play;
        if (typeof origPlay !== 'function') {
            sk46MediaUrlHooked = true;
            return;
        }
        sk46MediaUrlHooked = true;
        sk46MediaUrlRestores.push(() => { proto.play = origPlay; });
        proto.play = function () {
            try { sk46LastMediaEl = this; } catch {}
            return origPlay.call(this);
        };
    }

    const sk46BlobStore = new Map();

    function sk46MediaCachedFor(url) {
        const file = sk46AudioFileFromUrl(url);
        if (!file) return false;
        return sk46BlobStore.has(file);
    }

    function sk46CachedBufferForFile(file) {
        if (!file) return null;
        const inMem = sk46BlobStore.get(file);
        return inMem ? inMem.slice(0) : null;
    }

    function sk46FetchMediaBytes(url) {
        const file = sk46AudioFileFromUrl(url);
        const cachedBlob = sk46BlobStore.get(file);
        if (cachedBlob) return Promise.resolve(cachedBlob.slice(0));
        return sk46FetchMediaBytesNetwork(url, file);
    }

    async function sk46FetchMediaBytesFallback(url) {
        const file = sk46AudioFileFromUrl(url);
        const cachedBlob = sk46BlobStore.get(file);
        if (cachedBlob) return cachedBlob.slice(0);
        const attempts = [
            { cache: 'force-cache', mode: 'cors' },
            { cache: 'reload', mode: 'cors' },
            { cache: 'no-store', mode: 'cors' },
            { cache: 'no-store', mode: 'no-cors' },
        ];
        let lastErr = null;
        for (const opts of attempts) {
            const ctl = new AbortController();
            const timer = setTimeout(() => ctl.abort(), 45000);
            try {
                const res = await fetch(url, Object.assign({ signal: ctl.signal }, opts));
                if (!res.ok) { lastErr = new Error('HTTP ' + res.status + ' (' + opts.cache + ')'); continue; }
                const buf = await res.arrayBuffer();
                sk46CacheMediaBytes(file, url, buf);
                return buf;
            } catch (e) {
                lastErr = new Error((e && e.message || String(e)) + ' [' + opts.cache + '/' + opts.mode + ']');
            } finally {
                clearTimeout(timer);
            }
        }
        throw lastErr || new Error('all download strategies failed');
    }

    function sk46ArrayBufferToBase64(buf) {
        const bytes = new Uint8Array(buf);
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
    }

    function sk46CacheMediaBytes(file, url, buf) {
        if (!file || !buf || !buf.byteLength) return;
        try {
            sk46BlobStore.set(file, buf.slice(0));
            ;
        } catch (e) {
            ;
        }
    }

    function sk46FetchMediaBytesNetwork(url, file) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'arraybuffer',
                timeout: 45000,
                anonymous: false,
                headers: {
                    'Referer': `${SK46_GROUP.origin}/`,
                    'Origin': SK46_GROUP.origin,
                    'Accept': '*/*',
                },
                onload: (res) => {
                    if (res.status === 200) {
                        sk46CacheMediaBytes(file, url, res.response);
                        resolve(res.response);
                        return;
                    }
                    if (res.status === 403) {
                        reject(new Error('HTTP 403 — CloudFront rejected the audio URL (invalid or expired signature). Replay the voice message and try again.'));
                        return;
                    }
                    if (res.status === 416 || res.status === 404) {
                        reject(new Error('HTTP ' + res.status + ' — no audio file at this URL.'));
                        return;
                    }
                    reject(new Error('HTTP ' + res.status));
                },
                onerror: () => reject(new Error('network error while downloading the audio file')),
                ontimeout: () => reject(new Error('timed out while downloading the audio file')),
            });
        });
    }

    function sk46UnwrapTranscriptionText(raw) {
        if (typeof raw !== 'string') return '';
        const s = raw.trim();
        if (!s.startsWith('{')) return raw;
        try {
            const inner = JSON.parse(s);
            if (inner && inner.audioTranscription && typeof inner.audioTranscription.text === 'string') {
                return inner.audioTranscription.text;
            }
            if (inner && typeof inner.text === 'string') return inner.text;
        } catch {}
        return raw;
    }

function sk46NormalizeWordTimings(raw) {
        if (!Array.isArray(raw)) return [];
        const out = [];
        for (const item of raw) {
            if (!item) continue;
            const w = String(item.w != null ? item.w : (item.word != null ? item.word : '')).trim();
            if (!w) continue;
            const s = sk46ToSeconds(item.s != null ? item.s : item.start != null ? item.start : item.startOffset != null ? item.startOffset : item.start_offset);
            const e = sk46ToSeconds(item.e != null ? item.e : item.end != null ? item.end : item.endOffset != null ? item.endOffset : item.end_offset);
            if (s == null || !Number.isFinite(s)) continue;
            out.push({ w, s, e: (e != null && Number.isFinite(e) && e > s) ? e : s + 0.12 });
        }
        return out;
    }

    function sk46ToSeconds(v) {
        if (v == null) return null;
        let n;
        if (typeof v === 'number') n = v;
        else {
            const s = String(v).trim().replace(/s$/i, '');
            if (!s) return null;
            n = Number(s);
        }
        if (!Number.isFinite(n)) return null;
        
        return n > 21600 ? n / 1000 : n;
    }

    function sk46ExtractTranscription(data) {
        const d = data && data.candidates && data.candidates[0];
        if (!d) return { text: '', detail: 'no candidate' };
        const parts = (d.content && d.content.parts) || [];
        let text = '';
        const shape = [];
        const rawWords = [];
        for (const p of parts) {
        if (!p || typeof p !== 'object') continue;
        shape.push(Object.keys(p).join('+') || '(empty)');
        const at = p.audioTranscription || p.audio_transcription;
        if (at && typeof at === 'object') {
        if (typeof at.text === 'string') text += at.text;
        if (Array.isArray(at.words)) rawWords.push(...at.words);
        } else if (typeof p.text === 'string') {
        text += sk46UnwrapTranscriptionText(p.text);
        }
        }
        const words = sk46NormalizeWordTimings(rawWords);
        return {
        text,
        words,
            text: text.trim(),
            detail: 'parts=[' + shape.join(', ') + '] finishReason=' + (d.finishReason || '?'),
        };
    }

    async function sk46CallSttGemini(buffer, file, model, apiKey) {
        const mime = 'audio/mp4';
        const dedicated = sk46IsDedicatedSttModel(model);
        const parts = [{ inline_data: { mime_type: mime, data: sk46ArrayBufferToBase64(buffer) } }];
        const body = { contents: [{ role: 'user', parts }] };
        if (dedicated) {
            body.generationConfig = {
                audioTranscriptionConfig: {
                    languageCodes: [],
                    
                    wordTimestamp: true,
                },
            };
        } else {
            
            parts.push({ text: SK46_AUDIO_TRANSCRIBE_PROMPT });
            
            body.generationConfig = { temperature: 0.2 };
            if (/gemini-[3-9]/.test(model)) body.generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };
            else if (/gemini-2\.[5-9]|thinking/.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        sk46Trace('stt:request', {
            provider: 'gemini',
            model,
            file,
            audioBytes: buffer.byteLength,
            audioKB: Math.round(buffer.byteLength / 1024),
            mime,
            dedicatedStt: dedicated,
            wordTimestamp: dedicated,
            
            endpoint: `models/${model}:generateContent`,
        });
        const res = await sk46GmFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                timeout: 120000,
            }
        );
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                const err = await res.json();
                if (err && err.error && err.error.message) msg = `HTTP ${res.status}: ${err.error.message}`;
                if (res.status === 429) msg = 'QUOTA: ' + msg;
            } catch {}
            sk46Trace('stt:http-error', { provider: 'gemini', file, status: res.status, message: msg });
            throw new Error(msg);
        }
const data = await res.json();
        const out = sk46ExtractTranscription(data);
        
        out.text = String(out.text || '').trim();
        sk46Trace('stt:response', {
            provider: 'gemini',
            model,
            file,
            detail: out.detail,
            chars: out.text.length,
            words: out.words.length,
            
            preview: out.text.slice(0, 120),
        });
        if (!out.text) {
            ;
            throw new Error('empty transcript (' + out.detail + ')');
        }
        if (!dedicated && !out.words.length) {
            sk46Trace('stt:no-timestamps', {
                provider: 'gemini', model, file,
                note: 'audio-understanding model — transkrip tanpa timing, popup akan polos',
            });
        }
        return out;
    }

    async function sk46CallSttOpenAICompat(buffer, file, model, apiKey, provider) {
        const endpoint = provider === 'groq'
            ? 'https://api.groq.com/openai/v1/audio/transcriptions'
            : 'https://api.openai.com/v1/audio/transcriptions';
        const boundary = '----sk46' + Math.random().toString(36).slice(2);
        const ext = (file.match(SK46_AUDIO_EXT_RE) || ['', 'm4a'])[0].replace('.', '');
        const mime = 'audio/' + (ext === 'm4a' ? 'mp4' : ext);
        
        const enc = new TextEncoder();
        const segs = [];
        segs.push(enc.encode(
            `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file}"\r\nContent-Type: ${mime}\r\n\r\n`));
        segs.push(new Uint8Array(buffer));
        segs.push(enc.encode(
            `\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${model}`));
        segs.push(enc.encode(
            `\r\n--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json`));
        
        segs.push(enc.encode(
            `\r\n--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nword`));
        segs.push(enc.encode(`\r\n--${boundary}--\r\n`));

        let total = 0;
        for (const s of segs) total += s.length;
        const body = new Uint8Array(total);
        let off = 0;
        for (const s of segs) { body.set(s, off); off += s.length; }
        
        const bodyBuf = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
        sk46Trace('stt:request', {
            provider: provider === 'groq' ? 'groq' : 'openai-compatible',
            model,
            file,
            audioBytes: buffer.byteLength,
            audioKB: Math.round(buffer.byteLength / 1024),
            mime,
            responseFormat: 'verbose_json',
            timestampGranularities: 'word',
            bodyBytes: body.length,
            endpoint,
        });
        const res = await sk46GmFetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Authorization': 'Bearer ' + apiKey,
            },
            body: bodyBuf,
            timeout: 120000,
        });
        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                const err = await res.json();
                if (err && err.error && (err.error.message || err.error)) {
                    msg = `HTTP ${res.status}: ${typeof err.error === 'string' ? err.error : err.error.message}`;
                }
                if (res.status === 429) msg = 'QUOTA: ' + msg;
            } catch {}
            sk46Trace('stt:http-error', { provider, file, status: res.status, message: msg });
            throw new Error(msg);
        }
        const parsed = await res.json();
        const text = parsed && parsed.text;
        if (!text || !String(text).trim()) throw new Error('empty transcript');
        
        const words = sk46NormalizeWordTimings(parsed && parsed.words);
        sk46Trace('stt:response', {
            provider,
            file,
            chars: String(text).trim().length,
            words: words.length,
            preview: String(text).trim().slice(0, 120),
        });
        if (!words.length) ;
        return { text: String(text).trim(), words };
    }

    async function sk46TranscribeAudio(url, file, preloadedBuffer) {
        const provider = sk46EffectiveAudioProvider();
        const model = sk46EffectiveAudioModel();
        const apiKey = sk46EffectiveAudioApiKey();
        if (!sk46SupportsStt(provider)) throw new Error('provider ' + provider + ' does not support transcription');
        if (!apiKey) throw new Error('API key for ' + provider + ' is not set');
        if (!model) throw new Error('no transcription model selected');
        let buffer = preloadedBuffer || null;
        if (buffer) {
            ;
        } else {
        
        try {
            buffer = await sk46FetchMediaBytes(url);
        } catch (e) {
            ;
            try {
                buffer = await sk46FetchMediaBytesFallback(url);
            } catch (e2) {
                ;
                if (!buffer) {
                    const msg = String(e2 && e2.message || e2);
                    throw new Error(msg + sk46StaleUrlHint(sk46AudioKeyForFile(file)));
                }
            }
        }
        }
        if (provider === 'gemini') return sk46CallSttGemini(buffer, file, model, apiKey);
        return sk46CallSttOpenAICompat(buffer, file, model, apiKey, provider);
    }

    async function sk46TranslateTranscript(text, words) {
        const units = sk46BuildSemanticUnits(text, words);
        if (!units.length) throw new Error('empty transcript');

        ;
        sk46Trace('translate:units', {
            units: units.length,
            hasWordTimings: !!(words && words.length),
            sourceChars: String(text || '').length,
        });

        const prompt = sk46BuildContextPrompt(units);
        
        const unitChars = units.reduce((s, u) => s + String(u.text || '').length, 0);
        const ctxMaxTokens = Math.max(SK46_MIN_MAX_OUTPUT_TOKENS, Math.min(32768, Math.ceil(unitChars * 0.9) + 512));
        sk46Trace('translate:request', {
            provider: sk46State.provider,
            model: sk46State.model,
            targetLanguage: sk46State.language,
            tone: sk46State.presetTone,
            nicknameSuppressed: true,
            promptChars: prompt.length,
        });
        const raw = await sk46GovernorCall(
            sk46State.provider,
            () => sk46CallLLMPrompt(prompt, SK46_TRANSCRIPT_SYSTEM_INSTRUCTION, ctxMaxTokens),
            ctxMaxTokens + sk46EstimateTokens(SK46_TRANSCRIPT_SYSTEM_INSTRUCTION) + sk46EstimateTokens(prompt)
        );
        sk46Trace('translate:raw', {
            provider: sk46State.provider,
            rawChars: String(raw || '').length,
            raw: String(raw || '').slice(0, 400),
        });
        const parsed = sk46ParseContextResponse(raw, units.length);
        if (!parsed) {
            sk46Trace('translate:parse-failed', { expected: units.length });
            throw new Error('context parse failed');
        }
        const missing = parsed.filter(x => !String(x || '').trim()).length;

        const contexts = [];
        for (let i = 0; i < units.length; i++) {
            const translated = String(parsed[i] || '').trim();
            if (!translated) continue;
            contexts.push({
                id: units[i].id,
                source: units[i].text,
                translated,
                start: units[i].start,
                end: units[i].end,
                words: words && words.length ? words.slice(units[i].wStart, units[i].wEnd) : null,
            });
        }
        sk46Trace('translate:parsed', {
            expected: units.length,
            got: contexts.length,
            missing,
        });
        
        ;
        if (!contexts.length) throw new Error('translation produced no context');
        return {
            translated: sk46JoinContextTranslations(contexts),
            contexts,
        };
    }

    function sk46JoinContextTranslations(contexts) {
        const pieces = contexts.map(c => String(c.translated || '').trim()).filter(Boolean);
        if (!pieces.length) return '';
        const cjk = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(pieces.join(''));
        return cjk ? pieces.join('') : pieces.join(' ');
    }

    function sk46CollectMediaResources() {
        let entries = [];
        try { entries = performance.getEntriesByType('resource') || []; } catch { return []; }
        const out = [];
        for (const e of entries) {
            if (!SK46_MEDIA_PATH_RE.test(e.name)) continue;
            let hostName = '', file = '', expiresMs = null;
            try {
                const u = new URL(e.name);
                hostName = u.host;
                file = decodeURIComponent(u.pathname.split('/').pop() || '');
                const ex = u.searchParams.get('Expires');
                if (ex) expiresMs = Number(ex) * 1000;
            } catch { continue; }
            const ext = (file.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
            out.push({
                host: hostName,
                file,
                ext,
                audioExt: SK46_AUDIO_EXT_RE.test(file),
                initiatorType: e.initiatorType,
                durationMs: Math.round(e.duration || 0),
                transferSize: e.transferSize,
                decodedBodySize: e.decodedBodySize,
                startTime: Math.round(e.startTime || 0),
                expiresInMin: expiresMs ? Math.round((expiresMs - Date.now()) / 60000) : null,
                url: e.name.slice(0, 220),
            });
        }
        out.sort((a, b) => b.startTime - a.startTime);
        return out;
    }

    let sk46ExpectedPlayback = null;
    let sk46ExpectedPlaybackAt = 0;
    const SK46_EXPECT_PLAYBACK_TTL_MS = 20000;

    function sk46ExpectPlaybackOf(entry) {
        if (!entry) return;
        sk46ExpectedPlayback = entry;
        sk46ExpectedPlaybackAt = Date.now();
        sk46Trace('play:expected', { anchor: entry.anchorKey, file: entry.file || null });
    }

    function sk46ExpectedPlaybackFor() {
        const e = sk46ExpectedPlayback;
        if (!e) return null;
        if (Date.now() - sk46ExpectedPlaybackAt > SK46_EXPECT_PLAYBACK_TTL_MS) {
            sk46ExpectedPlayback = null;
            return null;
        }
        if (!e.el || !e.el.isConnected) { sk46ExpectedPlayback = null; return null; }
        return e;
    }

    function sk46TakeExpectedPlayback(file) {
        const e = sk46ExpectedPlaybackFor();
        if (!e) return null;
        
        if (e.file && file && e.file !== file) {
            sk46Trace('play:expected-mismatch', { expected: e.file, got: file });
            sk46ExpectedPlayback = null;
            return null;
        }
        sk46ExpectedPlayback = null;
        return e;
    }

    function sk46PinTabOnPlay(entry) {
        if (!entry) return;
        if (sk46PopupEntry !== entry) return;
        if (!sk46PopupCard.classList.contains('visible')) return;
        sk46PopupTabPinned = true;
        ;
    }

    let sk46PlayTriggerInstalled = false;

    function sk46IsAudioPlaying(entry) {
        const el = sk46LastMediaEl;
        if (!el) return false;
        try {
            if (el.paused === true) return false;
            if (el.ended === true) return false;
        } catch { return false; }
        const src = el.currentSrc || el.getAttribute('src') || '';
        const file = sk46AudioFileFromUrl(src);
        if (file && entry.file) return file === entry.file;
        if (entry.file && sk46MediaUrls) {
            const rec = sk46MediaUrls.get(sk46AudioKeyForFile(entry.file));
            if (rec && rec.url === src) return true;
        }
        return true;
    }

    function sk46FindPlayButtonFromTarget(target) {
        const btn = target.closest('flt-semantics[role="button"][flt-tappable]');
        if (!btn) return null;
        const group = btn.parentElement;
        if (!group || group.tagName.toLowerCase() !== 'flt-semantics') return null;
        if (!sk46IsAudioGroupLabel(group.getAttribute('aria-label'))) return null;
        if (!sk46GroupHasAudioSlider(group)) return null;
        const r = btn.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.width > 80 || r.height > 80) return null;
        return { btn, group };
    }

    function sk46EnablePlayTrigger() {
        if (sk46PlayTriggerInstalled) return;
        sk46PlayTriggerInstalled = true;
        document.addEventListener('click', (e) => {
            if (!sk46State.autoTranscribe) return;
            
            if (e.isTrusted === false) return;
            const hit = sk46FindPlayButtonFromTarget(e.target);
            if (!hit) return;
            const entry = sk46AudioEntries.find(en => en.el === hit.group);
            if (!entry) return;
            
            sk46ClaimManualPlay();
            if (sk46IsAudioPlaying(entry)) {
                ;
                return;
            }
            ;
            sk46PinTabOnPlay(entry);
            sk46ExpectPlaybackOf(entry);
            requestAnimationFrame(() => sk46OpenPopup(entry, false));
        }, true);
    }

function sk46ClearEverything(includeSettings) {
    const counts = {};

    counts.transcripts = sk46TranscriptCache.size;
    sk46TranscriptCache.clear();
    sk46GmSet(SK46_TRANSCRIPT_STORE_KEY, '{}');
    counts.audioBlobs = sk46BlobStore.size;
    sk46BlobStore.clear();
    
    sk46GmSet(SK46_HISTORY_KEY, '[]');
    sk46GmSet(SK46_FILE_MAP_KEY, '{}');
    for (const group of Object.values(SK46_GROUPS)) {
        const key = (suffix) => `sk46.v2.${group.id}.${suffix}`;
        sk46GmSet(key('audioTranscripts'), '{}');
        sk46GmSet(key('audioHistory'), '[]');
        sk46GmSet(key('audioFileMap'), '{}');
        sk46GmSet(key('translations'), '');
    }
    sk46MediaUrls.clear();
    sk46UrlByAnchor.clear();
    sk46WaitingForUrl.clear();
    for (const e of sk46AudioEntries) {
        e.transcript = null;
        e.translated = null;
        e.contexts = null;
        e.words = null;
        e.url = null;
        e.file = null;
        e.fileKey = null;
        e.status = 'idle';
        e.error = null;
        e.translationError = null;
        sk46ClearWaitingForUrl(e);
    }
    sk46ClosePopup();

    counts.translations = sk46TranslationCache.size;
    sk46ClearTranslationCache(true);

    if (includeSettings) {
        sk46ResetPersisted();
        sk46ApplyStateToUI();
        counts.settingsReset = true;
    }

    try { sk46FullRebuild(); } catch (e) { ; }

    ;
    return counts;
}

    const SK46_PRIVACY_FALLBACK_URL = 'https://github.com/zeem12/sakamichi-mobame-translate';
    function sk46PrivacyDocUrl() {
        const meta = (typeof GM_info === 'object' && GM_info && GM_info.script && GM_info.script.homepageURL) || '';
        const url = String(meta).trim() || SK46_PRIVACY_FALLBACK_URL;
        return url.replace(/\/+$/, '');
    }

    function sk46Init() {
        sk46InjectFontLink();
        const loadedCount = sk46LoadPersistedState();
        ;
        const loadedTranslations = sk46LoadPersistentTranslations();
        ;
        const loadedTranscripts = sk46LoadTranscriptStore();
        ;

        sk46SyncProfileNickname();

        document.body.appendChild(sk46OverlayStyle);
        document.body.appendChild(sk46OverlayLayer);
        document.body.appendChild(sk46MirrorBgLayer);
        document.body.appendChild(sk46MirrorLayer);
        document.body.appendChild(sk46RefreshLayer);
        if (sk46HudHost) document.body.appendChild(sk46HudHost);
        document.body.appendChild(sk46TranslateBtn);
        document.body.appendChild(sk46SheetHost);
        document.body.appendChild(sk46PopupHost);

        sk46ApplyStateToUI();
        sk46InstallMediaUrlObserver();
        sk46TrackMediaElement();
        sk46InstallOutsideClickClose();
        sk46EnablePlayTrigger();
        sk46WatchHost();
        sk46WatchForActivationButton();
        sk46HoverEnabled = !!(window.matchMedia
            && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
        if (sk46HoverEnabled) {
            document.addEventListener('mousemove', sk46OnHoverMove, { passive: true, capture: true });
            document.addEventListener('mouseleave', sk46OnHoverLeave);
        }
        sk46RafLoopId = requestAnimationFrame(sk46RepositionLoop);
    }

    function sk46Bootstrap() {
        if (document.body) {
            sk46Init();
        } else {
            document.addEventListener('DOMContentLoaded', () => sk46Init(), { once: true });
        }
    }

    sk46Bootstrap();
})();
