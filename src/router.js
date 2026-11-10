// Hash-based URLs for the app's screens. Hash URLs work on any static host
// (GitHub Pages has no SPA fallback for real paths like /study).
//   home → no hash, study → #/study, exam → #/exam, results → #/results
export const ROUTES = ['home', 'study', 'exam', 'results'];

export function parseRoute(hash) {
    const m = /^#\/([a-z]*)$/.exec(hash || '');
    const name = m ? m[1] : '';
    return name !== 'home' && ROUTES.includes(name) ? name : 'home';
}

export function routeHash(route) {
    return route === 'home' ? '' : `#/${route}`;
}

// Path reported to analytics, so each screen shows up as its own page.
export function routePath(route) {
    return route === 'home' ? '/' : `/${route}`;
}

// Analytics paths for dialogs, reported when they open (they have no URL of their own).
export const DIALOG_PATHS = { settings: '/settings', signIn: '/sign-in', signUp: '/sign-up' };
