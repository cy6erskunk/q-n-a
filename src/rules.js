// Rule reference popup: fetch markdown rule files and display article content.

const rulesCache = {};

async function fetchRulesFile(type) {
    const filename = type === 't' ? 'Technical_rules.md' : 'Organisation_rules.md';
    if (rulesCache[filename]) return rulesCache[filename];
    const response = await fetch(`./rules/${filename}`);
    if (!response.ok) throw new Error(`Could not load ${filename} (${response.status})`);
    const text = await response.text();
    rulesCache[filename] = text;
    return text;
}

// Find the content of an article in the markdown text.
// Falls back to progressively shorter refs: e.g. t.38.2.b → t.38.2 → t.38
function extractArticle(markdown, articleRef) {
    const parts = articleRef.split('.');
    for (let len = parts.length; len >= 2; len--) {
        const candidate = parts.slice(0, len).join('.');
        const escaped = candidate.replace(/\./g, '\\.');
        const headerRe = new RegExp(`^###\\s+${escaped}\\s*$`, 'm');
        const match = headerRe.exec(markdown);
        if (!match) continue;
        const afterHeader = markdown.slice(match.index + match[0].length);
        const nextHeader = /^#{1,3}\s/m.exec(afterHeader);
        const content = (nextHeader ? afterHeader.slice(0, nextHeader.index) : afterHeader).trim();
        return { articleRef: candidate, originalRef: articleRef, content };
    }
    return null;
}

// Pattern that matches rule article numbers (e.g. t.38, o.99.5, t.38.2.b)
const ARTICLE_REF_RE = /\b([ot]\.\d+(?:\.\d+)*(?:\.[a-z])?)\b/g;

// Escape HTML and process inline markdown (bold, italic, article refs).
function processInline(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(ARTICLE_REF_RE, '<button class="rule-ref" data-article="$1">$1</button>');
}

// Return true if the line is a markdown table separator (e.g. |---|---|).
function isTableSeparator(line) {
    return /^\|(\s*:?-+:?\s*\|)+$/.test(line.trim());
}

// Return true if the block looks like a markdown table.
function isTable(block) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.length >= 2 && lines[0].startsWith('|') && lines.some(isTableSeparator);
}

// Convert a markdown table block to an HTML table wrapped in a scrollable div.
function tableToHtml(block) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const sepIdx = lines.findIndex(isTableSeparator);
    if (sepIdx === -1) return `<p>${processInline(block)}</p>`;

    const headerLines = lines.slice(0, sepIdx);
    const bodyLines = lines.slice(sepIdx + 1);

    const parseRow = line =>
        line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

    const renderCells = (cells, tag) =>
        cells.map(cell => `<${tag}>${processInline(cell)}</${tag}>`).join('');

    const thead = headerLines
        .map(line => `<tr>${renderCells(parseRow(line), 'th')}</tr>`)
        .join('');
    const tbody = bodyLines
        .map(line => `<tr>${renderCells(parseRow(line), 'td')}</tr>`)
        .join('');

    return `<div class="rule-table-wrap"><table class="rule-table">${thead ? `<thead>${thead}</thead>` : ''}${tbody ? `<tbody>${tbody}</tbody>` : ''}</table></div>`;
}

// Convert article content (plain/light markdown) to safe HTML.
// Also makes nested article cross-references clickable.
function articleContentToHtml(text) {
    return text
        .split(/\n\s*\n/)
        .map(para => para.trim())
        .filter(Boolean)
        .map(para => {
            if (isTable(para)) return tableToHtml(para);
            return `<p>${processInline(para).replace(/\n/g, '<br>')}</p>`;
        })
        .join('');
}

// Turn explanation text into HTML, wrapping rule references in clickable buttons.
// Safe for use with innerHTML – plain text is HTML-escaped before injection.
export function renderExplanationHtml(text) {
    // Escape everything first, then selectively unwrap rule references.
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Match the two patterns found in questions.json:
    //   "Article o.80.3"  /  "Article t.38.2.b"
    //   "[See t.41.1]"    /  "[See t.41.1 and t.165]"
    // We replace each article-number occurrence individually with a <button>.
    return escaped.replace(
        /\b([ot]\.\d+(?:\.\d+)*(?:\.[a-z])?)\b/g,
        '<button class="rule-ref" data-article="$1">$1</button>'
    );
}

// Load and display an article in the rule popup dialog.
export async function openRuleArticle(articleRef, dialog) {
    const type = articleRef[0]; // 't' or 'o'
    const titleEl = dialog.querySelector('.rule-dialog-title');
    const bodyEl = dialog.querySelector('.rule-dialog-body');

    titleEl.textContent = `Article ${articleRef}`;
    bodyEl.innerHTML = '<p class="rule-loading">Loading…</p>';

    if (!dialog.open) dialog.showModal();

    try {
        const markdown = await fetchRulesFile(type);
        const result = extractArticle(markdown, articleRef);
        if (!result) {
            bodyEl.innerHTML = '<p class="rule-not-found">Article not found.</p>';
            return;
        }
        if (result.articleRef !== result.originalRef) {
            titleEl.textContent = `Article ${result.articleRef}`;
        }
        bodyEl.innerHTML = articleContentToHtml(result.content);
        // Wire up any cross-reference buttons inside the popup
        bodyEl.querySelectorAll('.rule-ref').forEach(btn => {
            btn.addEventListener('click', () => openRuleArticle(btn.dataset.article, dialog));
        });
    } catch (err) {
        bodyEl.innerHTML = `<p class="rule-error">Failed to load article: ${err.message}</p>`;
    }
}
