// Pageviews for the rule article popup (openRuleArticle), with analytics mocked.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./analytics.js', () => ({ trackPageview: vi.fn() }));

const { trackPageview } = await import('./analytics.js');
const { openRuleArticle } = await import('./rules.js');

const MARKDOWN = `
### t.38

See also t.41.

### t.41

Article t.41 content.
`;

let dialog;

beforeEach(() => {
    trackPageview.mockClear();
    document.body.innerHTML = `
        <dialog id="rule-dialog">
            <h2 class="rule-dialog-title">Article</h2>
            <div class="rule-dialog-body"></div>
        </dialog>`;
    dialog = document.getElementById('rule-dialog');
    dialog.showModal = function () { this.open = true; };
    globalThis.fetch = vi.fn(async () => ({ ok: true, text: async () => MARKDOWN }));
});

const tracked = () => trackPageview.mock.calls;

describe('rule popup tracking', () => {
    it('tracks the clicked article under the /rule-popup route', async () => {
        await openRuleArticle('t.38.2.b', dialog);
        expect(tracked()).toEqual([['/rule-popup/t.38.2.b', { route: '/rule-popup' }]]);
    });

    it('tracks the popup as soon as it opens, before the article loads', () => {
        globalThis.fetch = vi.fn(() => new Promise(() => {}));
        openRuleArticle('o.80', dialog);
        expect(tracked()).toEqual([['/rule-popup/o.80', { route: '/rule-popup' }]]);
    });

    it('tracks cross-references opened from inside the popup', async () => {
        await openRuleArticle('t.38', dialog);
        dialog.querySelector('.rule-ref[data-article="t.41"]').click();
        await vi.waitFor(() => expect(tracked()).toHaveLength(2));
        expect(tracked()[1]).toEqual(['/rule-popup/t.41', { route: '/rule-popup' }]);
    });
});
