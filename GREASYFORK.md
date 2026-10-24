# Sakamichi Mobame Translate

An independent, unofficial, non-commercial userscript that adds per-bubble
translation overlays and voice message transcription to the **櫻坂46メッセージ**,
**乃木坂46メッセージ**, and **日向坂46メッセージ** web apps. It runs in your
browser, has no server of its own, and uses your own AI provider API key.

**Unofficial fan project — use at your own risk.** Not affiliated with,
authorized by, endorsed by, sponsored by, or officially connected to 櫻坂46,
乃木坂46, 日向坂46, Sony Music Solutions Inc., their management companies, or
any of their affiliates. This is an independent, personal, non-commercial
project. You are responsible for your own use of the script and for complying
with each app's terms. Read the full notices before installing.

**License:** MIT — [source code](https://github.com/zeem12/sakamichi-mobame-translate/blob/main/LICENSE)

**Repository:** [github.com/zeem12/sakamichi-mobame-translate](https://github.com/zeem12/sakamichi-mobame-translate)

## Demo

<center>
<img src="https://raw.githubusercontent.com/zeem12/sakamichi-mobame-translate/main/media/demo_1.gif" width="260" alt="Demo 1">
<img src="https://raw.githubusercontent.com/zeem12/sakamichi-mobame-translate/main/media/demo_2.gif" width="260" alt="Demo 2">
<img src="https://raw.githubusercontent.com/zeem12/sakamichi-mobame-translate/main/media/demo_3.gif" width="260" alt="Demo 3">
</center>

*Example only: a mockup, not real paid content.*

## About

This is a personal fan project, created to help non-Japanese speakers use
the 櫻坂46, 乃木坂46, and 日向坂46 message apps. It adds two things the apps do
not offer: translation of messages and transcription of voice messages, both
shown directly over each message.

**What it is**

- An independent, unofficial, and non-commercial userscript for the apps' web
  versions.
- Free to use, with no ads and no paid features.
- A tool that works within your own logged-in session, on messages you can
  already view.

**What it is not**

- It is not affiliated with, endorsed by, or connected to the apps' operator,
  the groups, or their management companies.
- It does not provide, host, or redistribute any app content.
- It does not call the apps' APIs, crawl message history, or unlock anything
  you cannot already view.

Data handling is described in [Privacy](#privacy), and the full notices are in
the [Disclaimer](#disclaimer).

## Features

- **Text translation**: an overlay positioned directly over each message
  bubble, following scrolling, resizing, and the app's list virtualization.
- **Layered prompts**: translate into any of 47 languages, pick a tone, add
  custom instructions, and choose how your nickname appears in translations.
- **Voice messages**: a transcript and translation appear over the bubble,
  with word-by-word karaoke highlighting that follows the audio.
- **One settings sheet for all three apps**: provider, model, API keys, and
  style preferences are shared. Translation and voice caches are kept
  separately per app.
- **Local cache and rate limiting**: up to 1,500 translation entries and 500
  voice entries are remembered per app, so a message is not sent to your
  provider again unless you change your translation settings or refresh it.
  Per-provider rate limiting with automatic backoff helps you stay within your
  provider's limits.

## Supported apps

| App | Official name | Web address |
| --- | --- | --- |
| Nogizaka46 | 乃木坂46メッセージ | `https://message.nogizaka46.com/` |
| Sakurazaka46 | 櫻坂46メッセージ | `https://message.sakurazaka46.com/` |
| Hinatazaka46 | 日向坂46メッセージ | `https://message.hinatazaka46.com/` |

The script identifies the app from the hostname and stays inactive on every
other site.

## Requirements

- An active account with a subscription to at least one supported app.
- A desktop browser (Chrome, Edge, Firefox, or Opera) with a userscript
  manager — set up in step 1 of Installation.
- An API key for text translation, from any of the providers below:

| Provider | Get a key |
| --- | --- |
| Gemini (Google) | https://aistudio.google.com/app/apikey |
| Groq | https://console.groq.io/keys |
| Cerebras | https://cloud.cerebras.ai/ |
| OpenRouter | https://openrouter.ai/keys |
| DeepSeek | https://platform.deepseek.com/api_keys |
| OpenAI | https://platform.openai.com/api-keys |
| Anthropic (Claude) | https://console.anthropic.com/settings/keys |

- Voice transcription is available with **Gemini, Groq, or OpenAI**.
- Free tiers are available: **Gemini, Groq, and OpenRouter** all issue keys
  at no cost, and Groq's free plan includes voice transcription, so you can
  run the whole flow without paying anything. Free tiers are rate-limited and
  carry their own data terms (see the [Disclaimer](#disclaimer)).
- Usage is billed by your provider, not by this project.

## Installation

1. Install a userscript manager — a small extension that runs user scripts on
   the pages you choose:

| Browser | Userscript manager |
| --- | --- |
| Chrome | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag) |
| Edge | [Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |
| Firefox | [Tampermonkey](https://addons.mozilla.org/firefox/addon/tampermonkey/) or [Violentmonkey](https://addons.mozilla.org/firefox/addon/violentmonkey/) |
| Opera | [Tampermonkey](https://addons.opera.com/extensions/details/tampermonkey-beta/) or [Violentmonkey](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag) |

2. Install the script:

- **Greasy Fork** — open the
  [script page](https://greasyfork.org/en/scripts/601914-sakamichi-mobame-translate)
  and click **Install**.
- **GitHub Releases** — open `sakamichi-mobame-translate.user.js` from the
  [latest release](https://github.com/zeem12/sakamichi-mobame-translate/releases/latest);
  your userscript manager shows an install page, where you click **Install**.

## Getting started

1. Open a supported app in the same browser and sign in.
2. Open any member chat.
3. Click the translate control in the header to open the settings sheet:
   choose a provider, paste your API key, pick a model, and use the connection
   test.
4. Turn on the **Translate** switch.

## Privacy

The script runs in your browser: the project has no server, and no data ever
reaches the author. The project collects nothing — no telemetry, no analytics,
no accounts, no third-party reporting — and no account identifiers, session
tokens, authentication headers, or network history are stored.

**Content that leaves your device** — only while translating or transcribing:
message text already on your screen, your style settings, your nickname, and
the audio of the voice message being transcribed. These are sent only to the
AI provider you configure, authenticated with your own API key.

**Stored on your device** — preferences and API keys in your userscript
manager's storage, translation caches, voice transcripts, and voice file maps.
Audio bytes are never written to storage.

Read the [full Privacy section](https://github.com/zeem12/sakamichi-mobame-translate#privacy)
for the complete data table and deletion controls.

## Disclaimer

**Unofficial project.** The project and its contributors are not affiliated
with, authorized by, endorsed by, sponsored by, or officially connected to
櫻坂46, 乃木坂46, or 日向坂46; Sony Music Solutions Inc., which operates the
apps; Seed & Flower LLC, the management company of 櫻坂46 and 日向坂46;
Nogizaka46 LLC, which is credited as a copyright holder for 乃木坂46メッセージ;
or any of their affiliates. It is an independent, personal, non-commercial
project created by a fan to help non-Japanese speakers use the apps.

**App terms and content.** Your use of each app is governed by that app's Terms
of Service, linked in the [Supported apps](#supported-apps) table. The project
does not assess whether any use of the script is consistent with those terms,
and you are solely responsible for reviewing and complying with them. The
project claims no ownership of app content, member names, or anything else
accessed through the apps, and it grants no licenses to any such content.

**Third-party services.** Translations and transcripts are produced by the AI
providers you choose. Their quality and accuracy are those providers'
responsibility, not the project's, and AI output can be incorrect. Charges,
usage limits, and data handling are governed by each provider's own terms. You
are solely responsible for your API keys and for any charges they incur.

**No warranty.** The script is provided "AS IS", without warranty of any kind,
express or implied. To the fullest extent permitted by applicable law, any
risk arising from the use of the script lies with the user, and the author and
contributors accept no liability for any claims, damages, loss of access to an
app or account, or other consequences arising from the use of, or inability to
use, the script.

Read the [full Disclaimer](https://github.com/zeem12/sakamichi-mobame-translate#disclaimer)
for the complete notices, including trademarks, availability, and acceptance.

## License

The script's source code in this repository is released under the
[MIT License](https://github.com/zeem12/sakamichi-mobame-translate/blob/main/LICENSE).

The license covers the source code only. It grants no rights to any app
content, member names, trademarks, or anything processed by the script; all of
those remain with their respective owners.

## Support

This project is free and non-commercial. If you would like to support the
author's open-source work in general:

<a href="https://ko-fi.com/zeem12"><img src="https://img.shields.io/badge/Ko--fi-Support-ff5e5b?style=flat-square&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
<a href="https://trakteer.id/zeem12/tip"><img src="https://img.shields.io/badge/Trakteer-Support-be1e2d?style=flat-square" alt="Trakteer"></a>

Bug reports and feature requests are welcome on the
[issue tracker](https://github.com/zeem12/sakamichi-mobame-translate/issues).
When reporting a problem, include your browser, userscript manager, and script
version, and remove API keys and personal information from any screenshots or
logs.
