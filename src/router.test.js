import { describe, it, expect } from 'vitest';
import { ROUTES, parseRoute, routeHash, routePath } from './router.js';

describe('parseRoute', () => {
    it('maps the screen hashes to routes', () => {
        expect(parseRoute('#/study')).toBe('study');
        expect(parseRoute('#/exam')).toBe('exam');
        expect(parseRoute('#/results')).toBe('results');
    });

    it('treats an empty or root hash as home', () => {
        expect(parseRoute('')).toBe('home');
        expect(parseRoute('#')).toBe('home');
        expect(parseRoute('#/')).toBe('home');
    });

    it('falls back to home for unknown hashes', () => {
        expect(parseRoute('#/nope')).toBe('home');
        expect(parseRoute('#study')).toBe('home');
        expect(parseRoute('#/study/extra')).toBe('home');
        expect(parseRoute('#/home')).toBe('home');
    });
});

describe('routeHash', () => {
    it('gives home no hash and every other route a #/ hash', () => {
        expect(routeHash('home')).toBe('');
        expect(routeHash('study')).toBe('#/study');
        expect(routeHash('exam')).toBe('#/exam');
        expect(routeHash('results')).toBe('#/results');
    });

    it('round-trips with parseRoute', () => {
        ROUTES.forEach(route => expect(parseRoute(routeHash(route))).toBe(route));
    });
});

describe('routePath', () => {
    it('gives each route a distinct path for analytics', () => {
        expect(routePath('home')).toBe('/');
        expect(routePath('study')).toBe('/study');
        expect(routePath('exam')).toBe('/exam');
        expect(routePath('results')).toBe('/results');
    });
});
