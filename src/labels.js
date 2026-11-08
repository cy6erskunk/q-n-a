// Question labels used to group questions. A question with a label is only
// included in study/exam sessions while that label's filter is switched on;
// unlabeled questions are always included.

export const QUESTION_LABELS = [
    { id: 'team', name: 'Team events' },
    { id: 'fie', name: 'FIE events' },
];

const STORAGE_KEY = 'labelFilters';

function defaultFilters() {
    return Object.fromEntries(QUESTION_LABELS.map(l => [l.id, true]));
}

export function filterQuestionsByLabels(questions, enabled) {
    return questions.filter(q =>
        (q.labels || []).every(label => enabled[label] !== false)
    );
}

export function loadLabelFilters() {
    const filters = defaultFilters();
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved === 'object') {
            for (const id of Object.keys(filters)) {
                if (typeof saved[id] === 'boolean') filters[id] = saved[id];
            }
        }
    } catch {
        // ignore corrupt data, keep defaults
    }
    return filters;
}

export function saveLabelFilters(filters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}
