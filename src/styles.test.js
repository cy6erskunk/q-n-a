import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8');

// Returns the CSS outside any `@media (hover: hover)` block.
function stripHoverMediaBlocks(source) {
    let out = '';
    let i = 0;
    const marker = /@media\s*\(\s*hover\s*:\s*hover\s*\)\s*\{/g;
    let m;
    while ((m = marker.exec(source))) {
        out += source.slice(i, m.index);
        let depth = 1;
        let j = marker.lastIndex;
        while (depth > 0 && j < source.length) {
            if (source[j] === '{') depth++;
            else if (source[j] === '}') depth--;
            j++;
        }
        i = j;
        marker.lastIndex = j;
    }
    return out + source.slice(i);
}

describe('option button hover styles', () => {
    it('only applies hover styling on devices that can hover (avoids sticky hover on touch)', () => {
        expect(css).toMatch(/@media\s*\(\s*hover\s*:\s*hover\s*\)[^]*\.option-btn:hover/);
        expect(stripHoverMediaBlocks(css)).not.toMatch(/\.option-btn:hover/);
    });
});
