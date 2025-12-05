import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  /* Start quiz */
  await page.getByRole('button', { name: 'Start Quiz' }).click();

  /* Answer 5 questions */
  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();

  /* Finish quiz */
  await page.getByRole('button', { name: 'Finish Quiz' }).click();

  /* Start next round */
  await page.getByRole('button', { name: 'Start Next Round' }).click();

  /* Answer 5 questions */
  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  await page.getByRole('button').nth(4).click();

  /* Finish quiz */
  await page.getByRole('button', { name: 'Finish Quiz' }).click();

  /* Reset quiz */
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Reset All Progress' }).click();

  /* Start quiz */
  await page.getByRole('button', { name: 'Start Quiz' }).click();

  /* Answer 1 question */
  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  /* click x button and confirm */
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => { });
  });
  await page.getByRole('button', { name: 'Exit quiz' }).click();

  /* Answer 1 question */
  await page.getByRole('button').nth(4).click();
  await page.getByRole('button', { name: 'Next Question' }).click();

  /* click x button and confirm */
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.accept().catch(() => { });
  });
  await page.getByRole('button', { name: 'Exit quiz' }).click();

  /* we are at the beginning again */
  // expect(await page.getByRole('button', { name: 'Start Quiz' })).toBeInViewport();
  await page.getByRole('button', { name: 'Start Quiz' }).click();
});