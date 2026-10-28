const assert = require('assert');
const fs = require('fs');

function createMockNestedLinkMessage() {
    class MockElement {
        constructor(tagName, attrs = {}, textContent = '') {
            this.tagName = tagName.toUpperCase();
            this.attributes = attrs;
            this.textContent = textContent;
            this.children = [];
            this.parentElement = null;
            this._rect = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
        }
        getAttribute(name) { return this.attributes[name] || null; }
        setAttribute(name, val) { this.attributes[name] = val; }
        appendChild(child) {
            this.children.push(child);
            child.parentElement = this;
            return child;
        }
        contains(other) {
            let p = other ? other.parentElement : null;
            while (p) {
                if (p === this) return true;
                p = p.parentElement;
            }
            return false;
        }
        getBoundingClientRect() { return this._rect; }
        querySelector(selector) {
            const all = this.querySelectorAll(selector);
            return all.length ? all[0] : null;
        }
        querySelectorAll(selector) {
            const matches = [];
            const check = (node) => {
                for (const child of node.children) {
                    if (matchesSelector(child, selector)) matches.push(child);
                    check(child);
                }
            };
            check(this);
            return matches;
        }
    }

    function matchesSelector(el, selector) {
        if (selector === 'flt-semantics, flt-semantics-container') {
            return el.tagName === 'FLT-SEMANTICS' || el.tagName === 'FLT-SEMANTICS-CONTAINER';
        }
        if (selector === 'a, [role="link"]') {
            return el.tagName === 'A' || el.getAttribute('role') === 'link';
        }
        if (selector === '[role="button"][flt-tappable], input, [aria-owns]') {
            return (el.getAttribute('role') === 'button' && el.getAttribute('flt-tappable') !== null)
                || el.tagName === 'INPUT' || el.getAttribute('aria-owns') !== null;
        }
        if (selector === '[role="group"]') {
            return el.getAttribute('role') === 'group';
        }
        return false;
    }

    const host = new MockElement('flt-semantics-host');

    // Message Row (role="group")
    const row = new MockElement('flt-semantics', { role: 'group' });
    row._rect = { left: 16, top: 100, width: 360, height: 120, right: 376, bottom: 220 };
    host.appendChild(row);

    // Outer Bubble container (rich text container holding text + link)
    const bubble = new MockElement('flt-semantics', {}, 'ブログ更新したよー！\nぜひ読んでね✍️\nhttps://www.hinatazaka46.com/s/official/diary/detail/715');
    bubble._rect = { left: 72, top: 110, width: 300, height: 100, right: 372, bottom: 210 };
    row.appendChild(bubble);

    // Span 1: Japanese text before link
    const textSpan = new MockElement('flt-semantics', {}, 'ブログ更新したよー！\nぜひ読んでね✍️');
    textSpan._rect = { left: 72, top: 110, width: 130, height: 45, right: 202, bottom: 155 };
    bubble.appendChild(textSpan);

    // Inner Link container: has child link/semantics, shifted right/below
    const linkContainer = new MockElement('flt-semantics', {}, 'https://www.hinatazaka46.com/s/official/diary/detail/715');
    linkContainer._rect = { left: 100, top: 160, width: 272, height: 40, right: 372, bottom: 200 };
    bubble.appendChild(linkContainer);

    // Inner Anchor element inside linkContainer
    const anchor = new MockElement('flt-semantics', { role: 'link' }, 'https://www.hinatazaka46.com/s/official/diary/detail/715');
    anchor._rect = { left: 100, top: 160, width: 272, height: 40, right: 372, bottom: 200 };
    linkContainer.appendChild(anchor);

    return { host, row, bubble, textSpan, linkContainer, anchor };
}

const SK46_JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/;
function sk46HasJapanese(text) { return SK46_JAPANESE_RE.test(text); }
const SK46_TEXT_MIRROR_MIN_HEIGHT_PX = 40;

function sk46IsRichTextContainer(el) {
    if (!el) return false;
    if (el.getAttribute('role') === 'group') return false;
    const text = (el.textContent || '').trim();
    if (!text || !sk46HasJapanese(text)) return false;
    const childSemantics = el.querySelectorAll('flt-semantics, flt-semantics-container');
    if (!childSemantics.length) return false;
    if (el.querySelector('[role="group"]')) return false;
    if (el.querySelector('[role="button"][flt-tappable], input, [aria-owns]')) return false;
    const hasLink = !!el.querySelector('a, [role="link"]');
    const hasMultipleSpans = childSemantics.length > 1;
    if (!hasLink && !hasMultipleSpans) return false;
    let r;
    try { r = el.getBoundingClientRect(); } catch { return false; }
    return r && r.width > 0 && r.height >= SK46_TEXT_MIRROR_MIN_HEIGHT_PX;
}

function classifyTree(host) {
    const all = Array.from(host.querySelectorAll('flt-semantics, flt-semantics-container'));
    const richTextContainers = new Set();
    for (const el of all) {
        if (sk46IsRichTextContainer(el)) richTextContainers.add(el);
    }
    
    // We want the OUTERMOST container (the whole bubble), so delete child/nested containers
    for (const rtc of Array.from(richTextContainers)) {
        for (const other of Array.from(richTextContainers)) {
            if (other !== rtc && rtc.contains(other)) {
                richTextContainers.delete(other);
            }
        }
    }
    const richTextDescendants = new Set();
    for (const rtc of richTextContainers) {
        for (const desc of rtc.querySelectorAll('flt-semantics, flt-semantics-container')) {
            richTextDescendants.add(desc);
        }
    }

    return all.map((el, i) => {
        const isRtc = richTextContainers.has(el);
        const isRtcDesc = richTextDescendants.has(el);
        const isLeaf = isRtc || !el.querySelector('flt-semantics, flt-semantics-container');
        const rect = el.getBoundingClientRect();
        const text = (el.textContent || '').trim();
        let category;
        if (isRtcDesc) category = 'rich-text-child';
        else if (isRtc) category = 'text';
        else if (!isLeaf) category = 'container';
        else if (text) category = 'text';
        else if (rect.width === 0 || rect.height === 0) category = 'empty-zero';
        else category = 'empty-tall';
        return { el, isLeaf, category, text, rect };
    });
}

const { host, row, bubble, textSpan, linkContainer, anchor } = createMockNestedLinkMessage();
const nodes = classifyTree(host);
const textLeaves = nodes.filter(n => n.category === 'text');

console.log('Classified text nodes with nested link:', textLeaves.map(n => ({ text: n.text, width: n.rect.width, left: n.rect.left })));

assert.strictEqual(textLeaves.length, 1, 'There should be exactly 1 text node representing the whole bubble');
assert.strictEqual(textLeaves[0].el, bubble, 'Must select bubble, NOT inner linkContainer');
assert.strictEqual(textLeaves[0].rect.left, 72, 'Bubble left must be 72 (not inner link container 100)');
assert.strictEqual(textLeaves[0].rect.width, 300, 'Bubble width must be 300');

console.log('Nested link container selection test passed!');
