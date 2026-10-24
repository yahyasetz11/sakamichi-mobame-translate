const assert = require('assert');
const fs = require('fs');

// Check that the iOS userscript exists
assert(fs.existsSync('src/sakamichi-mobame-translate-ios.user.js'), 'src/sakamichi-mobame-translate-ios.user.js must exist');

const src = fs.readFileSync('src/sakamichi-mobame-translate-ios.user.js', 'utf8');

// 1. Metadata checks
assert(src.includes('// @name           Sakamichi Mobame Translate (iOS)'), 'Must have iOS specific name');
assert(src.includes('// @run-at         document-start'), 'Must run at document-start for early semantics');
assert(src.includes('// @version        1.1.0-ios'), 'Must have iOS version string');

// 2. Early semantics initialization
assert(src.includes('flutterConfiguration.enableSemantics = true'), 'Must enable semantics on flutterConfiguration');

// 3. Safe DOM bootstrap
assert(src.includes('function sk46Bootstrap()'), 'Must contain safe bootstrap function');
assert(src.includes('DOMContentLoaded'), 'Must listen to DOMContentLoaded if body is not ready');

// 4. Viewport ratio support for full-width mobile screens
assert(!src.includes('SK46_VIEWPORT_FILL_RATIO = 0.98'), 'Must not restrict viewport to desktop < 0.98 ratio');

// 5. FAB fallback class and styling
assert(src.includes('sk46-fab-fallback'), 'Must include FAB fallback class');
assert(src.includes('env(safe-area-inset-bottom'), 'Must support safe area inset for iOS home indicator');

// 6. Multi-layer audio element capture
assert(src.includes("addEventListener('play'"), 'Must include document play event listener for audio capture');

// 7. Stay permissions error hint
assert(src.includes('Stay'), 'Must include Stay permission guidance on connection failure');

console.log('iOS userscript test passed.');
