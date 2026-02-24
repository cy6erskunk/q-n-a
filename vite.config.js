import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RULE_FILES = ['Technical_rules.md', 'Organisation_rules.md'];
const rulesDir = path.join(__dirname, 'docs/rules');

function rulesPlugin() {
    return {
        name: 'rules-static',
        configureServer(server) {
            server.middlewares.use('/rules', (req, res, next) => {
                const urlPath = req.url.split('?')[0].replace(/^\//, '');
                const filePath = path.join(rulesDir, urlPath);
                if (RULE_FILES.includes(path.basename(filePath)) && fs.existsSync(filePath)) {
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
        },
    };
}

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
    },
    plugins: [rulesPlugin()],
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.js'],
    },
});
