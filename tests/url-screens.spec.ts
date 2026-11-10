import { test, expect, Page } from '@playwright/test';

const APP = 'http://localhost:3000/';

const startScreen = (page: Page) => page.locator('#start-screen');
const quizScreen = (page: Page) => page.locator('#quiz-screen');
const endScreen = (page: Page) => page.locator('#end-screen');
const hash = (page: Page) => page.evaluate(() => location.hash);

async function finishSession(page: Page) {
  for (;;) {
    await page.locator('.option-btn').first().click();
    const finishing = (await page.locator('#next-button').textContent()) === 'Finish Session';
    await page.locator('#next-button').click();
    if (finishing) break;
  }
  await expect(endScreen(page)).toBeVisible();
}

test('home has no hash; starting a study session sets #/study', async ({ page }) => {
  await page.goto(APP);
  expect(await hash(page)).toBe('');
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  await expect(quizScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('#/study');
});

test('starting an exam sets #/exam', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Exam' }).click();
  await expect(quizScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('#/exam');
});

test('finishing a session shows #/results, and Back returns home', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  await finishSession(page);
  expect(await hash(page)).toBe('#/results');

  await page.goBack();
  await expect(startScreen(page)).toBeVisible();
  await expect(endScreen(page)).toBeHidden();
  expect(await hash(page)).toBe('');
});

test('another session from results replaces the history entry', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  await finishSession(page);
  await page.getByRole('button', { name: 'Try Another Session' }).click();
  await expect(quizScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('#/study');

  // Back leaves the session (after confirming) instead of returning to stale results
  page.once('dialog', dialog => dialog.accept());
  await page.goBack();
  await expect(startScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('');
});

test('Back during a session asks for confirmation; dismissing keeps the session', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  const question = await page.locator('#question').textContent();

  let message = '';
  page.once('dialog', dialog => { message = dialog.message(); dialog.dismiss(); });
  await page.goBack();
  await expect.poll(() => message).toBe('Are you sure you want to exit?');
  await expect(quizScreen(page)).toBeVisible();
  await expect(page.locator('#question')).toHaveText(question!);
  await expect.poll(() => hash(page)).toBe('#/study');

  // Back works again after dismissing, and accepting leaves the session
  page.once('dialog', dialog => dialog.accept());
  await page.goBack();
  await expect(startScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('');
});

test('the exit button returns home and clears the hash', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Exit session' }).click();
  await expect(startScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('');

  // Leaving popped the session entry, so Forward returns to it and starts a fresh session
  await page.goForward();
  await expect(quizScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('#/study');
});

test('the header link goes home from results', async ({ page }) => {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Start Study Session' }).click();
  await finishSession(page);
  await page.getByRole('button', { name: 'Go to home screen' }).click();
  await expect(startScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('');
});

test('opening #/exam directly starts an exam', async ({ page }) => {
  await page.goto(APP + '#/exam');
  await expect(quizScreen(page)).toBeVisible();
  await expect(page.locator('#progress-counter')).toContainText('of');
  expect(await hash(page)).toBe('#/exam');

  // There is no home entry to go back to, so leaving replaces the URL
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Exit session' }).click();
  await expect(startScreen(page)).toBeVisible();
  expect(await hash(page)).toBe('');
});

test('opening #/results or an unknown hash directly shows home without a hash', async ({ page }) => {
  for (const h of ['#/results', '#/nope']) {
    await page.goto(APP + h);
    await expect(startScreen(page)).toBeVisible();
    await expect.poll(() => hash(page)).toBe('');
  }
});
