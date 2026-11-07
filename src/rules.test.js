import { describe, it, expect } from 'vitest';
import { extractArticle, articleContentToHtml, renderExplanationHtml } from './rules.js';
import { readFileSync } from 'fs';
import path from 'path';

// ─── extractArticle ────────────────────────────────────────

describe('extractArticle', () => {
    const sampleMarkdown = `
## Section

### t.38

This is article t.38 content.
It has multiple lines.

### t.38.2

This is article t.38.2 content.

### t.38.2.b

This is article t.38.2.b content.

### t.39

Next article.
`;

    it('finds an exact article by reference', () => {
        const result = extractArticle(sampleMarkdown, 't.38.2');
        expect(result).not.toBeNull();
        expect(result.articleRef).toBe('t.38.2');
        expect(result.originalRef).toBe('t.38.2');
        expect(result.content).toContain('This is article t.38.2 content.');
    });

    it('finds an article with sub-level reference', () => {
        const result = extractArticle(sampleMarkdown, 't.38.2.b');
        expect(result).not.toBeNull();
        expect(result.articleRef).toBe('t.38.2.b');
        expect(result.content).toContain('This is article t.38.2.b content.');
    });

    it('falls back to a shorter reference when exact is not found', () => {
        const result = extractArticle(sampleMarkdown, 't.38.99');
        expect(result).not.toBeNull();
        expect(result.articleRef).toBe('t.38');
        expect(result.originalRef).toBe('t.38.99');
    });

    it('returns null when no matching article exists', () => {
        const result = extractArticle(sampleMarkdown, 't.99');
        expect(result).toBeNull();
    });

    it('stops content at the next header', () => {
        const result = extractArticle(sampleMarkdown, 't.38');
        expect(result).not.toBeNull();
        expect(result.content).not.toContain('t.38.2 content');
        expect(result.content).not.toContain('Next article');
    });

    it('works for organisation rule references (o.prefix)', () => {
        const markdown = `### o.80\n\nOrganisation article content.\n\n### o.81\n\nNext.\n`;
        const result = extractArticle(markdown, 'o.80');
        expect(result).not.toBeNull();
        expect(result.articleRef).toBe('o.80');
        expect(result.content).toContain('Organisation article content.');
    });
});

// ─── articleContentToHtml ──────────────────────────────────

describe('articleContentToHtml', () => {
    it('wraps paragraphs in <p> tags', () => {
        const html = articleContentToHtml('Hello world.\n\nSecond paragraph.');
        expect(html).toBe('<p>Hello world.</p><p>Second paragraph.</p>');
    });

    it('escapes HTML special characters', () => {
        const html = articleContentToHtml('A & B < C > D');
        expect(html).toContain('A &amp; B &lt; C &gt; D');
    });

    it('converts **bold** to <strong>', () => {
        const html = articleContentToHtml('This is **important**.');
        expect(html).toContain('<strong>important</strong>');
    });

    it('converts *italic* to <em>', () => {
        const html = articleContentToHtml('This is *emphasized*.');
        expect(html).toContain('<em>emphasized</em>');
    });

    it('converts inline newlines to <br>', () => {
        const html = articleContentToHtml('Line one\nLine two');
        expect(html).toContain('<br>');
    });

    it('turns article references into clickable buttons', () => {
        const html = articleContentToHtml('See t.38 for details.');
        expect(html).toContain('<button class="rule-ref" data-article="t.38">t.38</button>');
    });

    it('turns organisation article references into clickable buttons', () => {
        const html = articleContentToHtml('See o.80.3 for details.');
        expect(html).toContain('<button class="rule-ref" data-article="o.80.3">o.80.3</button>');
    });

    it('ignores empty input', () => {
        expect(articleContentToHtml('')).toBe('');
    });

    it('ignores whitespace-only input', () => {
        expect(articleContentToHtml('   \n\n   ')).toBe('');
    });
});

// ─── renderExplanationHtml ─────────────────────────────────

describe('renderExplanationHtml', () => {
    it('escapes & in plain text', () => {
        expect(renderExplanationHtml('A & B')).toContain('A &amp; B');
    });

    it('escapes < and > in plain text', () => {
        const result = renderExplanationHtml('x < y > z');
        expect(result).toContain('x &lt; y &gt; z');
    });

    it('linkifies technical article references', () => {
        const result = renderExplanationHtml('See Article t.38 for details.');
        expect(result).toContain('<button class="rule-ref" data-article="t.38">t.38</button>');
    });

    it('linkifies organisation article references', () => {
        const result = renderExplanationHtml('See Article o.80.3.');
        expect(result).toContain('<button class="rule-ref" data-article="o.80.3">o.80.3</button>');
    });

    it('linkifies article refs with sub-levels like t.38.2.b', () => {
        const result = renderExplanationHtml('[See t.38.2.b]');
        expect(result).toContain('<button class="rule-ref" data-article="t.38.2.b">t.38.2.b</button>');
    });

    it('linkifies multiple article refs in one string', () => {
        const result = renderExplanationHtml('See t.41.1 and t.165.');
        expect(result).toContain('data-article="t.41.1"');
        expect(result).toContain('data-article="t.165"');
    });

    it('returns plain text unchanged when no refs or special chars', () => {
        const result = renderExplanationHtml('No special content here.');
        expect(result).toBe('No special content here.');
    });

    it('does not double-escape HTML entities', () => {
        // Ampersand should be escaped exactly once
        const result = renderExplanationHtml('A & B');
        expect(result).not.toContain('&amp;amp;');
        expect(result).toContain('&amp;');
    });
});

describe('articleContentToHtml code fences', () => {
    it('renders a fenced block as preformatted text', () => {
        const html = articleContentToHtml('Order:\n\n```\n1–2 3–1\n3–4 2–4\n```');
        expect(html).toBe('<p>Order:</p><pre class="rule-pre">1–2 3–1\n3–4 2–4</pre>');
    });

    it('handles a fence directly after a text line (no blank line)', () => {
        const html = articleContentToHtml('**Pool of six:**\n```\n1–2 3–1\n```\n\nAfter.');
        expect(html).toBe('<p><strong>Pool of six:</strong></p><pre class="rule-pre">1–2 3–1</pre><p>After.</p>');
    });

    it('keeps blank lines inside a fenced block', () => {
        expect(articleContentToHtml('```\na\n\nb\n```')).toBe('<pre class="rule-pre">a\n\nb</pre>');
    });

    it('renders the o.69 bout orders without literal backticks', () => {
        const markdown = readFileSync(path.resolve(__dirname, '../docs/rules/Organisation_rules.md'), 'utf-8');
        const html = articleContentToHtml(extractArticle(markdown, 'o.69').content);
        expect(html).not.toContain('```');
        expect(html.match(/<pre class="rule-pre">/g)).toHaveLength(2);
    });

    it('escapes HTML inside fenced blocks', () => {
        expect(articleContentToHtml('```\n<b>\n```')).toBe('<pre class="rule-pre">&lt;b&gt;</pre>');
    });
});

// ─── Technical_rules.md (real data) ────────────────────────

describe('extractArticle on Technical_rules.md', () => {
    const markdown = readFileSync(
        path.resolve(__dirname, '../docs/rules/Technical_rules.md'),
        'utf-8',
    );

    it.each([
        ['t.7', 'It is stressed that this section'],
        ['t.14', 'Parries are simple, direct'],
        ['t.71', 'If a fencer appears on the piste'],
        ['t.72', 'When during a bout an irregularity'],
        ['t.112', 'By the mere fact of entering'],
    ])('extracts %s as its own article', (ref, start) => {
        const result = extractArticle(markdown, ref);
        expect(result).not.toBeNull();
        expect(result.articleRef).toBe(ref);
        expect(result.content.startsWith(start)).toBe(true);
    });
});

// ─── Article titles must not bleed into the previous article ──────────
// In the source PDF each article's title is printed just above its number.
// If that title line is left as plain text, it ends up as the last line of
// the *previous* article's content (e.g. t.8 ending with "Offensive and
// defensive actions", the title of t.9).

describe.each([
    ['Technical_rules.md', /^###\s+(t\.\d+)\s*$/gm],
    ['Organisation_rules.md', /^###\s+(o\.\d+)\s*$/gm],
])('article boundaries in %s', (file, headerRe) => {
    const markdown = readFileSync(path.resolve(__dirname, `../docs/rules/${file}`), 'utf-8');
    const refs = [...markdown.matchAll(headerRe)].map(m => m[1]);

    // A short line with no closing punctuation looks like a stray heading.
    const looksLikeTitle = line =>
        line.length < 90 &&
        !/[.;:,…)|`]$/.test(line) &&
        !/^[-|>]/.test(line) &&
        !/^[\d–\s]+$/.test(line); // bout-order rows like "1–2 6–2 1–4"

    it('has article headers', () => {
        expect(refs.length).toBeGreaterThan(100);
    });

    it.each(refs)('%s does not end with a stray title line', ref => {
        const { content } = extractArticle(markdown, ref);
        const lastLine = content.split('\n').map(l => l.trim()).filter(Boolean).pop();
        if (lastLine === undefined) return; // empty placeholder article in the source
        expect(looksLikeTitle(lastLine), `last line: "${lastLine}"`).toBe(false);
    });
});

describe('specific article fixes', () => {
    const technical = readFileSync(path.resolve(__dirname, '../docs/rules/Technical_rules.md'), 'utf-8');
    const organisation = readFileSync(path.resolve(__dirname, '../docs/rules/Organisation_rules.md'), 'utf-8');

    it('t.8 contains only its own text', () => {
        expect(extractArticle(technical, 't.8').content)
            .toBe('Fencing time is the time required to perform one simple fencing action.');
    });

    it('t.123 carries its own APPLICATION note instead of t.122', () => {
        expect(extractArticle(technical, 't.122').content).not.toContain('APPLICATION');
        expect(extractArticle(technical, 't.123').content.startsWith('*APPLICATION')).toBe(true);
    });

    it('t.169 does not swallow the t.170 table heading', () => {
        expect(extractArticle(technical, 't.169').content).not.toMatch(/Offences and penalties/);
    });

    it('o.80 has a well-formed header', () => {
        expect(extractArticle(organisation, 'o.80')?.articleRef).toBe('o.80');
    });
});
