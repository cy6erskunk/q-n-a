// Vercel Web Analytics. Only enabled for builds running on Vercel
// (VITE_VERCEL_ANALYTICS is defined in vite.config.js from Vercel's VERCEL=1 build
// variable), since the /_vercel/insights endpoint only exists on Vercel deployments.
import { inject as vercelInject } from '@vercel/analytics';

export function initAnalytics({
    enabled = import.meta.env.VITE_VERCEL_ANALYTICS === true,
    production = import.meta.env.PROD,
    inject = vercelInject,
} = {}) {
    if (!enabled) return false;
    inject({ mode: production ? 'production' : 'development' });
    return true;
}
