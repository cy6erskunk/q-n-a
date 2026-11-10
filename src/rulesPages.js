// Build-time rendering of the rules markdown (docs/rules) into standalone HTML
// pages, published next to the quiz app under rules/*.html.
// Used by the Vite plugin in vite.config.js; runs in Node, not in the browser.
import { Marked } from 'marked';

export const RULE_PAGES = [
    { md: 'Technical_rules.md', title: 'Technical rules' },
    { md: 'Technical_rules__toc.md', title: 'Technical rules — Contents' },
    { md: 'Technical_rules__index.md', title: 'Technical rules — Index' },
    { md: 'Organisation_rules.md', title: 'Organisation rules' },
    { md: 'Organisation_rules__toc.md', title: 'Organisation rules — Contents' },
    { md: 'Organisation_rules__index.md', title: 'Organisation rules — Index' },
].map(page => ({ ...page, html: page.md.replace(/\.md$/, '.html') }));

const NAV = [
    ['Technical rules', 'Technical_rules.html'],
    ['Contents', 'Technical_rules__toc.html'],
    ['Index', 'Technical_rules__index.html'],
    ['Organisation rules', 'Organisation_rules.html'],
    ['Contents', 'Organisation_rules__toc.html'],
    ['Index', 'Organisation_rules__index.html'],
];

// Same shape as the refs the quiz links (e.g. t.38, o.99.5, t.38.2.b).
const ARTICLE_REF = /^([ot])\.(\d+)(?:\.\d+)*(?:\.[a-z])?\b/;
// Article headings, tolerating a stray space ("### o. 80").
const ARTICLE_HEADING = /^([ot])\.\s*(\d+)$/;

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Link target for an article ref; sub-articles point at their top-level article.
export function articleHref(ref) {
    const [, letter, num] = ARTICLE_REF.exec(ref);
    const file = letter === 't' ? 'Technical_rules.html' : 'Organisation_rules.html';
    return `${file}#${letter}${num}`;
}

const marked = new Marked({
    gfm: true,
    extensions: [
        {
            name: 'articleRef',
            level: 'inline',
            start(src) {
                const m = /\b[ot]\.\d/.exec(src);
                return m ? m.index : undefined;
            },
            tokenizer(src) {
                if (this.lexer.state.inLink) return undefined; // never nest links
                const m = ARTICLE_REF.exec(src);
                if (m) return { type: 'articleRef', raw: m[0], ref: m[0] };
                return undefined;
            },
            renderer(token) {
                return `<a href="${articleHref(token.ref)}">${escapeHtml(token.ref)}</a>`;
            },
        },
    ],
    renderer: {
        heading(token) {
            const m = ARTICLE_HEADING.exec(token.text.trim());
            if (m) {
                const [, letter, num] = m;
                return `<h${token.depth} id="${letter}${num}">${letter}.${num}</h${token.depth}>\n`;
            }
            return false; // fall back to the default renderer
        },
    },
});

const STYLE = `
:root {
    --bg: #ffffff; --fg: #1a1a1a; --muted: #5f6368; --accent: #1a5fb4;
    --border: #dcdcdc; --stripe: #f5f5f5; --code-bg: #f3f3f3;
}
@media (prefers-color-scheme: dark) {
    :root {
        --bg: #161616; --fg: #e8e8e8; --muted: #a0a0a0; --accent: #8ab4f8;
        --border: #3a3a3a; --stripe: #1f1f1f; --code-bg: #232323;
    }
}
* { box-sizing: border-box; }
body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.top {
    position: sticky; top: 0; background: var(--bg); border-bottom: 1px solid var(--border);
    padding: 0.5rem 1rem; display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; font-size: 0.875rem;
}
.top a { color: var(--accent); text-decoration: none; }
.top a[aria-current="page"] { color: var(--fg); font-weight: 600; }
main { max-width: 46rem; margin: 0 auto; padding: 1rem 1rem 4rem; overflow-wrap: anywhere; }
a { color: var(--accent); }
h1, h2 { line-height: 1.25; }
h3[id] { scroll-margin-top: 4rem; margin-top: 2rem; }
h3[id]:target { color: var(--accent); }
blockquote { margin: 1rem 0; padding-left: 1rem; border-left: 3px solid var(--border); color: var(--muted); }
pre { background: var(--code-bg); padding: 0.75rem; overflow-x: auto; }
.table-wrap { overflow-x: auto; margin: 1rem 0; }
table { border-collapse: collapse; font-size: 0.875rem; }
th, td { border: 1px solid var(--border); padding: 0.375rem 0.5rem; text-align: left; vertical-align: top; }
tbody tr:nth-child(even) { background: var(--stripe); }
`;

// Render a rules markdown document into a complete standalone HTML page.
// Vercel Web Analytics for the static rules pages (same script @vercel/analytics injects).
const ANALYTICS_SCRIPT = '<script defer src="/_vercel/insights/script.js"></script>\n';

export function renderRulesPage(markdown, { title, current, analytics = false } = {}) {
    const body = marked
        .parse(markdown)
        .replace(/<table>/g, '<div class="table-wrap"><table>')
        .replace(/<\/table>/g, '</table></div>');
    const nav = NAV.map(([label, href]) =>
        `<a href="${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`,
    ).join('');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
${analytics ? ANALYTICS_SCRIPT : ''}</head>
<body>
<nav class="top"><a href="../">← Quiz</a>${nav}</nav>
<main>
${body}</main>
</body>
</html>
`;
}
