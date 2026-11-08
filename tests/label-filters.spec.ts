import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const questions: { question: string; labels?: string[] }[] = JSON.parse(
  readFileSync(resolve(__dirname, '../public/questions.json'), 'utf8'),
);
const unlabeled = questions.filter(q => !q.labels?.length).map(q => q.question);

test('label toggles filter questions in the study session and persist', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  const team = page.getByRole('switch', { name: 'Team events' });
  const fie = page.getByRole('switch', { name: 'FIE events' });
  await expect(team).toBeChecked();
  await expect(fie).toBeChecked();
  await expect(page.locator('#label-filters-info')).toHaveText(
    `${questions.length} of ${questions.length} questions included`,
  );

  await team.uncheck();
  await fie.uncheck();
  await expect(page.locator('#label-filters-info')).toHaveText(
    `${unlabeled.length} of ${questions.length} questions included`,
  );

  // Toggles survive a reload
  await page.reload();
  await expect(page.getByRole('switch', { name: 'Team events' })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: 'FIE events' })).not.toBeChecked();

  await page.getByRole('button', { name: 'Start Study Session' }).click();
  for (let i = 0; i < 5; i++) {
    const text = await page.locator('#question').textContent();
    expect(unlabeled).toContain(text);
    await page.locator('.option-btn').first().click();
    await page.locator('#next-button').click();
  }
});
