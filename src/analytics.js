// Vercel Web Analytics. Only enabled for builds running on Vercel
// (VITE_VERCEL_ANALYTICS is defined in vite.config.js from Vercel's VERCEL=1 build
// variable), since the /_vercel/insights endpoint only exists on Vercel deployments.
//
// Screens use hash URLs (#/study), and the Vercel script only auto-tracks path
// changes, so auto-tracking is off and every screen is reported via trackPageview().
import { inject as vercelInject, pageview as vercelPageview } from '@vercel/analytics';

let active = false;

// Never send query strings (e.g. auth callback tokens) or hashes to analytics.
export function stripUrl(event) {
    const url = new URL(event.url);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href };
}

export function initAnalytics({
    enabled = import.meta.env.VITE_VERCEL_ANALYTICS === true,
    production = import.meta.env.PROD,
    inject = vercelInject,
} = {}) {
    active = enabled;
    if (!enabled) return false;
    inject({
        mode: production ? 'production' : 'development',
        disableAutoTrack: true,
        beforeSend: stripUrl,
    });
    return true;
}

// `route` groups several paths in the dashboard (e.g. all rule popups); defaults to the path.
export function trackPageview(path, { route = path, pageview = vercelPageview } = {}) {
    if (!active) return;
    pageview({ route, path });
}

export function resetAnalyticsForTests() {
    active = false;
}
