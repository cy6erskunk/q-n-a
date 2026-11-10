import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAnalytics, trackPageview, stripUrl, resetAnalyticsForTests } from './analytics.js';

beforeEach(() => resetAnalyticsForTests());

describe('initAnalytics', () => {
    it('injects Vercel Web Analytics when enabled', () => {
        const inject = vi.fn();
        expect(initAnalytics({ enabled: true, inject })).toBe(true);
        expect(inject).toHaveBeenCalledTimes(1);
    });

    it('does nothing when disabled (e.g. GitHub Pages or local builds)', () => {
        const inject = vi.fn();
        expect(initAnalytics({ enabled: false, inject })).toBe(false);
        expect(inject).not.toHaveBeenCalled();
    });

    it('is disabled by default outside a Vercel build', () => {
        const inject = vi.fn();
        expect(initAnalytics({ inject })).toBe(false);
        expect(inject).not.toHaveBeenCalled();
    });

    it('passes an explicit mode so the production script is used in production builds', () => {
        const inject = vi.fn();
        initAnalytics({ enabled: true, inject, production: true });
        expect(inject.mock.calls[0][0].mode).toBe('production');
        initAnalytics({ enabled: true, inject, production: false });
        expect(inject.mock.calls[1][0].mode).toBe('development');
    });

    it('disables auto-tracking (screens are tracked manually) and strips URLs before sending', () => {
        const inject = vi.fn();
        initAnalytics({ enabled: true, inject });
        expect(inject.mock.calls[0][0].disableAutoTrack).toBe(true);
        expect(inject.mock.calls[0][0].beforeSend).toBe(stripUrl);
    });
});

describe('stripUrl', () => {
    it('removes the query string and hash from the event URL', () => {
        const event = { type: 'pageview', url: 'https://example.com/study?token=secret#/study' };
        expect(stripUrl(event)).toEqual({ type: 'pageview', url: 'https://example.com/study' });
    });

    it('leaves clean URLs unchanged', () => {
        const event = { type: 'pageview', url: 'https://example.com/' };
        expect(stripUrl(event)).toEqual(event);
    });
});

describe('trackPageview', () => {
    it('does nothing while analytics is disabled', () => {
        const pageview = vi.fn();
        initAnalytics({ enabled: false, inject: vi.fn() });
        trackPageview('/study', { pageview });
        expect(pageview).not.toHaveBeenCalled();
    });

    it('sends a pageview with the screen path as both route and path when enabled', () => {
        const pageview = vi.fn();
        initAnalytics({ enabled: true, inject: vi.fn() });
        trackPageview('/results', { pageview });
        expect(pageview).toHaveBeenCalledWith({ route: '/results', path: '/results' });
    });
});
