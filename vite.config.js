import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RULE_PAGES, renderRulesPage } from './src/rulesPages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vercel sets VERCEL=1 during its builds. Web Analytics (/_vercel/insights) only
// exists on Vercel deployments, so it stays off for GitHub Pages and local builds.
const vercelAnalytics = Boolean(process.env.VERCEL);

const RULE_FILES = ['Technical_rules.md', 'Organisation_rules.md'];
const rulesDir = path.join(__dirname, 'docs/rules');

// Serves/publishes the rules: raw markdown for the in-app article popups,
// plus rendered HTML pages (rules, contents, index) for reading in a browser.
function rulesPlugin() {
    const renderPage = page =>
        renderRulesPage(fs.readFileSync(path.join(rulesDir, page.md), 'utf-8'), {
            title: page.title,
            current: page.html,
            analytics: vercelAnalytics,
        });

    return {
        name: 'rules-static',
        configureServer(server) {
            server.middlewares.use('/rules', (req, res, next) => {
                const urlPath = req.url.split('?')[0].replace(/^\//, '');
                const filePath = path.join(rulesDir, urlPath);
                const page = RULE_PAGES.find(p => p.html === urlPath);
                if (page) {
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.end(renderPage(page));
                } else if (RULE_FILES.includes(path.basename(filePath)) && fs.existsSync(filePath)) {
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end(fs.readFileSync(filePath));
                } else {
                    next();
                }
            });
        },
        generateBundle() {
            RULE_FILES.forEach(file => {
                const filePath = path.join(rulesDir, file);
                if (fs.existsSync(filePath)) {
                    this.emitFile({
                        type: 'asset',
                        fileName: `rules/${file}`,
                        source: fs.readFileSync(filePath, 'utf-8'),
                    });
                }
            });
            RULE_PAGES.forEach(page => {
                this.emitFile({ type: 'asset', fileName: `rules/${page.html}`, source: renderPage(page) });
            });
        },
    };
}

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
    },
    define: {
        'import.meta.env.VITE_VERCEL_ANALYTICS': JSON.stringify(vercelAnalytics),
    },
    plugins: [rulesPlugin()],
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.js'],
    },
});
