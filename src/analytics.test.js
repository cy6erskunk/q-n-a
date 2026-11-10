import { describe, it, expect, vi } from 'vitest';
import { initAnalytics } from './analytics.js';

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
        expect(inject).toHaveBeenCalledWith({ mode: 'production' });
        initAnalytics({ enabled: true, inject, production: false });
        expect(inject).toHaveBeenLastCalledWith({ mode: 'development' });
    });
});
