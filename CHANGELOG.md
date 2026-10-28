# [v1.1.0](https://github.com/zeem12/sakamichi-mobame-translate/releases/tag/v1.1.0) (2026-10-23)

## Features

- **Indonesian Casual tone preset.** Added a dedicated `Indonesian Casual` preset tone tailored for idol message translation into Indonesian (informal "aku/kamu", natural conversational particles, avoiding awkward stiff forms or unnecessary Jaksel slang, and including few-shot examples).
- **Active sender detection and self-reference rule.** Detects the active member chat in Flutter semantics and instructs the translation model to translate third-person self-references (e.g. member referring to herself by name) as natural first-person pronouns.

# [v1.0.1](https://github.com/zeem12/sakamichi-mobame-translate/releases/tag/v1.0.1) (2026-10-24)

## Features

- **Refresh error indication.** Failed translations now show an error state through the refresh button and tooltip. The button turns red and shows a short summary derived from the provider error in a compact tooltip; it returns to normal after a successful retry.

## Bug Fixes

### Providers and models

- **Call info button pointed to the wrong provider.** It now opens the provider that actually handles transcription instead of always using the Talk provider (Gemini by default).
- **Voice model lists were hardcoded, and filtering/sorting was weak.** Chat and voice model lists are now fetched from each provider's live catalog with better filtering and sorting; voice lists are no longer hardcoded and prioritize word-timing support. Gemini 3.6+ no longer receives the deprecated temperature parameter, and OpenAI transcription requests use `json` for models that do not support `verbose_json`.
- **Outdated Gemini models and limits.** Removed the obsolete hardcoded Gemini 2.5-era transcription list and updated the Gemini rate limits to the current AI Studio free-tier values (Flash 5 RPM / 20 RPD, Flash-Lite 15/500, Transcribe 3/25, Gemma 4 30/14.4K). Models without a free-tier allowance (Gemini 2.0 Flash, Gemini 2.5 Pro, Gemini 3.1 Pro, and Gemini 4 Argon) are still listed. They use conservative RPM/TPM pacing without a daily cap, so paid keys are not held to free-tier RPD and free keys surface the provider quota error instead of being blocked locally.

# [v1.0.0](https://github.com/zeem12/sakamichi-mobame-translate/releases/tag/v1.0.0) (2026-10-23)

First public release.

## Features

### Apps and compatibility

- **Three apps, one script.** Works on the Sakurazaka46, Nogizaka46, and Hinatazaka46 Message web apps. The active app is detected from the hostname, and unsupported sites are left untouched.
- **Desktop browsers.** Chrome, Edge, Firefox, and Opera with Tampermonkey. Chrome, Firefox, and Opera are also supported with Violentmonkey.
- **Single-file release.** Distributed as one userscript with no companion server and no bundled third-party libraries.

### Interface

- **Header translate button.** Opens a bottom-sheet settings panel from the app header, and appears on the main page as well as in conversations, so settings can be opened before entering one. Themed to the current app.
- **In-place overlays.** Each translated bubble gets an overlay positioned directly over the original text, with its own control: a refresh button for text, a transcript button for voice, both in the member's bubble color. Overlays stay aligned while scrolling, resizing, using virtualized message lists, and while sticky headers and the bottom boundary move, and they are clipped at the app's edges and masked around floating app controls.
- **Hover to reveal.** Hovering a translated overlay fades it out so the original message underneath can be read; it fades back in when the pointer moves away or reaches the overlay's own buttons.
- **Transcript popup.** Opens near the bubble without covering its play button, with Original and Translation tabs. It tracks progress in plain language, switches to the Translation tab when the result is ready unless a tab was picked manually, and offers Retry on failure; Retry bypasses the cache.
- **Unread aware.** Messages you have not opened yet are detected and held back from translation until you reveal them.
- **Native behavior.** The settings sheet and transcript popup open and look the way the app's own overlays do — dimming backdrop, slide-up sheet, matching item layout — so they blend into the app rather than looking bolted on.

### Text translation

- **47 target languages.**
- **RTL support.** Arabic, Hebrew, Persian, and Urdu translations are rendered right-to-left in the overlays and in the transcript popup.
- **Tone presets.** Neutral (default), Formal, Casual, and Polite.
- **Nickname aware.** The nickname is read automatically from the app profile, kept unchanged, and can optionally be rendered as a preferred translation.
- **Custom instructions.** Optional per-user instructions are included in the translation prompt.
- **Meaning-first translations.** The prompt asks for natural target-language phrasing instead of word-for-word output, while preserving information order and the member's register.
- **Line contract.** The total line count of every post is preserved; line breaks may only move to a more natural word boundary.
- **Content preservation.** Emoji, kaomoji, URLs, @mentions, #hashtags, alphanumeric codes, and tone-carrying punctuation are preserved byte-for-byte.
- **Batch continuity.** Consecutive posts are translated as one batch so names, pronouns, voice, and terminology stay consistent.
- **Recent messages first.** Visible recent posts are prioritized; older visible history is handled in larger bulk batches.
- **Batched retries.** Malformed or failed batch responses are split and retried instead of dropping the whole group.
- **Live model discovery.** Available chat models are fetched from the selected provider, and the chosen model is remembered per provider.
- **Persistent cache.** Up to 1,500 translations per app survive reloads. Entries stay valid across provider and model changes but are invalidated when the target language, tone, nickname, or custom instructions change; cache hits do not spend provider quota.
- **Per-bubble refresh.** Bypasses the cache and translates that bubble again.
- **Automatic recovery.** Failed entries are retried automatically on a later pass instead of staying stuck on an error.
- **Rate governor.** A per-provider queue uses token buckets, automatic backoff, and adaptive batch sizes, and honors Retry-After and provider rate-limit headers to avoid exhausting provider limits.

### Voice messages

- **Transcript and translation.** Voice bubbles get a transcript button that opens the original transcript and the translated text.
- **Karaoke highlighting.** The transcript highlights word by word during playback, while the translation highlights matching segments. Models without word timing fall back to plain text.
- **Auto-transcribe on play.** On by default; can be turned off in settings.
- **Manual fallback.** If a transcript cannot start on its own, the popup asks you to play the voice message once.
- **Playback respect.** Transcription never stops playback that you started yourself.
- **Context-aware translation.** Long voice messages are split into semantic units, translated one-to-one, and mapped back to audio timing. The model is instructed never to merge, split, reorder, drop, or invent content.
- **Persistent transcript cache.** Up to 500 transcript and translation entries per app survive reloads, keyed to the specific voice message.
- **Re-translate without replaying.** Changing language, tone, nickname, or instructions re-translates saved voice transcripts without running speech-to-text again or fetching the audio again.
- **No stored audio.** Audio bytes are kept in memory only for the current tab and are never written to userscript storage.

### Providers and models

- **Seven translation providers.** Gemini, Groq, Cerebras, OpenRouter, DeepSeek, OpenAI, and Anthropic.
- **Three transcription providers.** Gemini, Groq, and OpenAI.
- **Separate Talk and Call configuration.** Text translation and voice transcription each have their own provider, API key, and model; voice reuses the Talk provider by default and can be pointed at its own.
- **Per-provider memory.** API keys, provider choices, and model choices are remembered per provider.
- **Key page shortcuts.** Each API key field links to the matching provider's key page.
- **Curated voice models.** Voice model pickers include short notes about trade-offs such as speed, cost, and missing word timing.

### Settings and data

- **One settings sheet.** Translate, Language, Provider & API, Preset, and Data & privacy.
- **Translate switch.** Master switch for text translation; off until you turn it on.
- **Preset.** Preferred nickname translation, tone, and custom instructions.
- **Data & privacy.** Opens the project's privacy documentation.
- **Delete all data.** Removes saved translations, voice transcripts, and voice file maps while keeping settings. Requires a second confirmation.
- **Reset everything.** Also deletes API keys and all settings. Requires a second confirmation.

### Privacy and reliability

- **No backend, no telemetry.** The script runs in your browser. The project has no server, analytics, or accounts.
- **Direct provider requests.** Message text and style settings go only to the translation provider you choose. Voice audio goes only to the transcription provider you choose.
- **Local API keys.** API keys are stored in the userscript manager's storage under the user's control. They are not encrypted by the script.
- **No crawling.** The script does not call the apps' APIs and does not crawl message history.
- **Settings change safety.** Results from an in-flight request are not applied to the page if translation settings change before the request finishes.
- **Cross-app data isolation.** Translation and voice caches are stored per app, while settings remain shared.
