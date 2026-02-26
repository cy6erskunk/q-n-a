import { describe, it, expect, vi } from 'vitest';

// Mock external dependencies so quiz.js can be imported without real auth/API
vi.mock('./auth.js', () => ({
    authEnabled: false,
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

const { normalizeCount, shuffleArray } = await import('./quiz.js');

// ─── normalizeCount ────────────────────────────────────────

describe('normalizeCount', () => {
    it('returns the integer for a positive number', () => {
        expect(normalizeCount(3)).toBe(3);
    });

    it('floors a positive float to an integer', () => {
        expect(normalizeCount(2.9)).toBe(2);
        expect(normalizeCount(1.1)).toBe(1);
    });

    it('returns 0 for zero', () => {
        expect(normalizeCount(0)).toBe(0);
    });

    it('returns 0 for negative numbers', () => {
        expect(normalizeCount(-1)).toBe(0);
        expect(normalizeCount(-100)).toBe(0);
    });

    it('parses numeric strings', () => {
        expect(normalizeCount('5')).toBe(5);
        expect(normalizeCount('2.7')).toBe(2);
    });

    it('returns 0 for non-numeric strings', () => {
        expect(normalizeCount('abc')).toBe(0);
        expect(normalizeCount('')).toBe(0);
    });

    it('returns 0 for null and undefined', () => {
        expect(normalizeCount(null)).toBe(0);
        expect(normalizeCount(undefined)).toBe(0);
    });

    it('returns 0 for NaN', () => {
        expect(normalizeCount(NaN)).toBe(0);
    });

    it('returns 0 for Infinity', () => {
        expect(normalizeCount(Infinity)).toBe(0);
        expect(normalizeCount(-Infinity)).toBe(0);
    });
});

// ─── shuffleArray ──────────────────────────────────────────

describe('shuffleArray', () => {
    it('does not change the length of the array', () => {
        const arr = [1, 2, 3, 4, 5];
        shuffleArray(arr);
        expect(arr).toHaveLength(5);
    });

    it('contains all original elements after shuffle', () => {
        const arr = [1, 2, 3, 4, 5];
        shuffleArray(arr);
        expect(arr).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
    });

    it('mutates the array in place', () => {
        const arr = [1, 2, 3];
        const ref = arr;
        shuffleArray(arr);
        expect(arr).toBe(ref);
    });

    it('handles an empty array without error', () => {
        const arr = [];
        expect(() => shuffleArray(arr)).not.toThrow();
        expect(arr).toEqual([]);
    });

    it('handles a single-element array without error', () => {
        const arr = [42];
        shuffleArray(arr);
        expect(arr).toEqual([42]);
    });

    it('produces different orderings over many iterations (probabilistic)', () => {
        // Run 20 shuffles and check at least one differs from original order.
        // The probability of all 20 keeping the exact same 5-element order is (1/120)^20 ≈ 0.
        const original = [1, 2, 3, 4, 5];
        let sawDifferent = false;
        for (let i = 0; i < 20; i++) {
            const arr = [...original];
            shuffleArray(arr);
            if (arr.join(',') !== original.join(',')) {
                sawDifferent = true;
                break;
            }
        }
        expect(sawDifferent).toBe(true);
    });
});
