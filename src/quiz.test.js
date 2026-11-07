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

const { normalizeCount, shuffleArray, quizProgressSegments } = await import('./quiz.js');

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

    it('reorders elements according to Math.random', () => {
        // Fisher-Yates on [1, 2, 3] with the mocked sequence:
        // i=2: j = floor(0.5 * 3) = 1 → swap index 2 ↔ 1: [1, 3, 2]
        // i=1: j = floor(0.0 * 2) = 0 → swap index 1 ↔ 0: [3, 1, 2]
        const spy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.0);
        const arr = [1, 2, 3];
        shuffleArray(arr);
        expect(arr).toEqual([3, 1, 2]);
        spy.mockRestore();
    });
});

// ─── quizProgressSegments ──────────────────────────────────

describe('quizProgressSegments', () => {
    it('on the first question the whole fill is the in-progress segment', () => {
        expect(quizProgressSegments(0, 5)).toEqual({ fillPercent: 20, donePercentOfFill: 0 });
    });

    it('splits the fill into done questions and the current one', () => {
        // Question 3 of 4: fill covers 3/4 of the track, 2 of those 3 parts are done
        const { fillPercent, donePercentOfFill } = quizProgressSegments(2, 4);
        expect(fillPercent).toBe(75);
        expect(donePercentOfFill).toBeCloseTo(200 / 3);
    });

    it('on the last question the fill spans the full track', () => {
        expect(quizProgressSegments(9, 10)).toEqual({ fillPercent: 100, donePercentOfFill: 90 });
    });

    it('returns zeros for a non-positive total', () => {
        expect(quizProgressSegments(0, 0)).toEqual({ fillPercent: 0, donePercentOfFill: 0 });
    });
});
