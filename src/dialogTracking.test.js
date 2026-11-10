// Pageviews for the settings and sign-in/sign-up dialogs, tested against the real
// index.html with quiz.js wired up (auth enabled, analytics spied on).
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('./auth.js', () => ({
    authEnabled: true,
    initAuth: vi.fn(),
    onSessionChange: vi.fn(() => () => {}),
    getSession: vi.fn(() => null),
    getUser: vi.fn(() => null),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('./api.js', () => ({
    dataApiEnabled: false,
    fetchProgress: vi.fn(),
    saveProgressToCloud: vi.fn(),
    deleteProgressFromCloud: vi.fn(),
}));

vi.mock('./rules.js', () => ({
    renderExplanationHtml: vi.fn(t => t),
    openRuleArticle: vi.fn(),
}));

vi.mock('./analytics.js', () => ({
    initAnalytics: vi.fn(),
    trackPageview: vi.fn(),
}));

const { trackPageview } = await import('./analytics.js');
const $ = id => document.getElementById(id);
const click = id => $(id).dispatchEvent(new MouseEvent('click', { bubbles: true }));

beforeAll(async () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    document.body.innerHTML = /<body>([\s\S]*)<\/body>/.exec(html)[1];
    // jsdom lacks showModal/close on <dialog>
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; };
    globalThis.fetch = vi.fn(() => new Promise(() => {})); // questions never load: no screen pageviews
    await import('./quiz.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
});

beforeEach(() => {
    trackPageview.mockClear();
    $('settings-dialog').close();
    $('auth-dialog').close();
});

const tracked = () => trackPageview.mock.calls.map(([path]) => path);

describe('settings dialog', () => {
    it('tracks /settings when opened', () => {
        click('settings-button');
        expect(tracked()).toEqual(['/settings']);
    });

    it('does not track closing it', () => {
        click('settings-button');
        click('close-settings');
        expect(tracked()).toEqual(['/settings']);
    });
});

describe('sign-in dialog', () => {
    it('tracks /sign-in when opened', () => {
        click('auth-button');
        expect(tracked()).toEqual(['/sign-in']);
    });

    it('tracks /sign-up and /sign-in when switching tabs', () => {
        click('auth-button');
        click('tab-signup');
        click('tab-signin');
        expect(tracked()).toEqual(['/sign-in', '/sign-up', '/sign-in']);
    });

    it('tracks the switch link too', () => {
        click('auth-button');
        click('auth-switch-btn');
        click('auth-switch-btn');
        expect(tracked()).toEqual(['/sign-in', '/sign-up', '/sign-in']);
    });

    it('does not track clicking the tab that is already active', () => {
        click('auth-button');
        click('tab-signin');
        expect(tracked()).toEqual(['/sign-in']);
    });

    it('opens in sign-in mode again after signing up was last shown', () => {
        click('auth-button');
        click('tab-signup');
        click('close-auth');
        trackPageview.mockClear();
        click('auth-button');
        expect(tracked()).toEqual(['/sign-in']);
    });
});
