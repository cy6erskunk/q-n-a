import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    QUESTION_LABELS,
    filterQuestionsByLabels,
    loadLabelFilters,
    saveLabelFilters,
} from './labels.js';

const plain = { id: 'plain' };
const plainEmpty = { id: 'plain-empty', labels: [] };
const team = { id: 'team', labels: ['team'] };
const fie = { id: 'fie', labels: ['fie'] };
const both = { id: 'both', labels: ['team', 'fie'] };
const all = [plain, plainEmpty, team, fie, both];
const ids = qs => qs.map(q => q.id);

describe('QUESTION_LABELS', () => {
    it('defines the team and fie labels', () => {
        expect(QUESTION_LABELS.map(l => l.id)).toEqual(['team', 'fie']);
    });
});

describe('filterQuestionsByLabels', () => {
    it('keeps every question when all labels are enabled', () => {
        expect(ids(filterQuestionsByLabels(all, { team: true, fie: true }))).toEqual(ids(all));
    });

    it('keeps only unlabeled questions when all labels are disabled', () => {
        expect(ids(filterQuestionsByLabels(all, { team: false, fie: false }))).toEqual(['plain', 'plain-empty']);
    });

    it('drops team questions when team is disabled', () => {
        expect(ids(filterQuestionsByLabels(all, { team: false, fie: true }))).toEqual(['plain', 'plain-empty', 'fie']);
    });

    it('drops fie questions when fie is disabled', () => {
        expect(ids(filterQuestionsByLabels(all, { team: true, fie: false }))).toEqual(['plain', 'plain-empty', 'team']);
    });

    it('treats labels missing from the filter as enabled', () => {
        expect(ids(filterQuestionsByLabels(all, {}))).toEqual(ids(all));
    });

    it('does not mutate the input array', () => {
        const input = [...all];
        filterQuestionsByLabels(input, { team: false, fie: false });
        expect(input).toEqual(all);
    });
});

describe('loadLabelFilters / saveLabelFilters', () => {
    it('defaults to every label enabled', () => {
        localStorage.clear();
        expect(loadLabelFilters()).toEqual({ team: true, fie: true });
    });

    it('round-trips through localStorage', () => {
        localStorage.clear();
        saveLabelFilters({ team: false, fie: true });
        expect(loadLabelFilters()).toEqual({ team: false, fie: true });
    });

    it('falls back to defaults for corrupt or partial data', () => {
        localStorage.setItem('labelFilters', '{not json');
        expect(loadLabelFilters()).toEqual({ team: true, fie: true });
        localStorage.setItem('labelFilters', JSON.stringify({ fie: false, bogus: 1 }));
        expect(loadLabelFilters()).toEqual({ team: true, fie: false });
    });
});

describe('questions.json labels', () => {
    const questions = JSON.parse(readFileSync(resolve(__dirname, '../public/questions.json'), 'utf8'));
    const known = new Set(QUESTION_LABELS.map(l => l.id));

    it('only uses known labels', () => {
        for (const q of questions) {
            if (q.labels === undefined) continue;
            expect(Array.isArray(q.labels)).toBe(true);
            for (const label of q.labels) expect(known.has(label)).toBe(true);
        }
    });

    it('labels every question that is explicitly about team events', () => {
        for (const q of questions) {
            if (/\bteams?\b/i.test(q.question) && !/individual/i.test(q.question)) {
                expect(q.labels, q.question).toContain('team');
            }
        }
    });

    it('has questions for each label and unlabeled ones', () => {
        for (const { id } of QUESTION_LABELS) {
            expect(questions.some(q => q.labels?.includes(id))).toBe(true);
        }
        expect(questions.some(q => !q.labels?.length)).toBe(true);
    });
});
