import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { RULE_PAGES, articleHref, renderRulesPage } from './rulesPages.js';

const readRules = file => readFileSync(path.resolve(__dirname, '../docs/rules', file), 'utf-8');

// ─── articleHref ───────────────────────────────────────────

describe('articleHref', () => {
    it.each([
        ['t.66', 'Technical_rules.html#t66'],
        ['t.23.3', 'Technical_rules.html#t23'],
        ['t.38.2.b', 'Technical_rules.html#t38'],
        ['o.80', 'Organisation_rules.html#o80'],
        ['o.61.4', 'Organisation_rules.html#o61'],
    ])('%s → %s', (ref, href) => {
        expect(articleHref(ref)).toBe(href);
    });
});

// ─── renderRulesPage ───────────────────────────────────────

describe('renderRulesPage', () => {
    const render = md => renderRulesPage(md, { title: 'Test' });
    // Only the rendered document, without the page chrome (navigation bar).
    const body = md => /<main>([\s\S]*)<\/main>/.exec(render(md))[1];

    it('gives article headings a linkable id', () => {
        expect(render('### t.66\n\nText.')).toContain('<h3 id="t66">t.66</h3>');
        expect(render('### o.80 \n\nText.')).toContain('<h3 id="o80">o.80</h3>');
    });

    it('does not add ids to non-article headings', () => {
        expect(render('## Chapter 1')).toContain('<h2>Chapter 1</h2>');
    });

    it('links article references in text to their article', () => {
        const html = render('See t.23.3 and o.5.');
        expect(html).toContain('<a href="Technical_rules.html#t23">t.23.3</a>');
        expect(html).toContain('<a href="Organisation_rules.html#o5">o.5</a>');
    });

    it('does not nest links inside existing links', () => {
        const html = body('Preamble [t.7](Technical_rules.html#t7)');
        expect(html.match(/<a /g)).toHaveLength(1);
        expect(html).toContain('<a href="Technical_rules.html#t7">t.7</a>');
    });

    it('does not link references inside code blocks', () => {
        expect(body('```\nt.1\n```')).not.toContain('<a ');
    });

    it('wraps tables in a horizontally scrollable container', () => {
        const html = render('| a | b |\n|---|---|\n| 1 | 2 |');
        expect(html).toMatch(/<div class="table-wrap"><table>[\s\S]*<\/table><\/div>/);
    });

    it('produces a complete page with title and navigation', () => {
        const html = renderRulesPage('# Hello', { title: 'Test', current: 'Technical_rules.html' });
        expect(html).toContain('<a href="Technical_rules.html" aria-current="page">');
        expect(html.startsWith('<!doctype html>')).toBe(true);
        expect(html).toContain('<title>Test</title>');
        expect(html).toContain('href="../"'); // back to the quiz app
        for (const { html: page } of RULE_PAGES) {
            expect(html).toContain(`href="${page}"`);
        }
    });

    it('escapes the title', () => {
        expect(renderRulesPage('', { title: 'A & <B>' })).toContain('<title>A &amp; &lt;B&gt;</title>');
    });

    it('adds the Vercel Web Analytics script only when analytics is enabled', () => {
        const script = '<script defer src="/_vercel/insights/script.js"></script>';
        expect(renderRulesPage('# Hi', { title: 'T' })).not.toContain('_vercel/insights');
        expect(renderRulesPage('# Hi', { title: 'T', analytics: false })).not.toContain('_vercel/insights');
        const html = renderRulesPage('# Hi', { title: 'T', analytics: true });
        expect(html).toContain(script);
        expect(html.indexOf(script)).toBeLessThan(html.indexOf('</head>'));
    });
});

// ─── Real rules data ───────────────────────────────────────

describe('RULE_PAGES', () => {
    it('lists the rules, ToC and index pages for both books', () => {
        expect(RULE_PAGES.map(p => p.md).sort()).toEqual([
            'Organisation_rules.md',
            'Organisation_rules__index.md',
            'Organisation_rules__toc.md',
            'Technical_rules.md',
            'Technical_rules__index.md',
            'Technical_rules__toc.md',
        ]);
        for (const page of RULE_PAGES) {
            expect(page.html).toBe(page.md.replace(/\.md$/, '.html'));
        }
    });
});

describe.each(['Technical_rules', 'Organisation_rules'])('rendered %s', book => {
    const html = renderRulesPage(readRules(`${book}.md`), { title: book });
    const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));

    it('has an anchor for every article', () => {
        const refs = [...readRules(`${book}.md`).matchAll(/^###\s+([ot])\.\s*(\d+)\s*$/gm)];
        expect(refs.length).toBeGreaterThan(100);
        for (const [, letter, num] of refs) expect(ids).toContain(`${letter}${num}`);
    });

    it.each(['__toc', '__index'])(`every ${book}.html link in %s resolves to an anchor`, suffix => {
        const page = renderRulesPage(readRules(`${book}${suffix}.md`), { title: 'x' });
        const anchors = [...page.matchAll(new RegExp(`href="${book}\\.html#([^"]+)"`, 'g'))].map(m => m[1]);
        expect(anchors.length).toBeGreaterThan(0);
        const missing = [...new Set(anchors)].filter(a => !ids.has(a));
        expect(missing).toEqual([]);
    });
});
