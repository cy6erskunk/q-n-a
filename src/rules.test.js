import { describe, it, expect } from 'vitest';
import { extractArticle, articleContentToHtml, renderExplanationHtml } from './rules.js';

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
