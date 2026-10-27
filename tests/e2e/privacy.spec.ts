import { expect, test } from '@playwright/test';
test('source HTML stays text and memory operations send no external requests', async ({ page }) => {
  await page.goto('./'); await page.getByRole('button', { name: 'Open example', exact: true }).click();
  const unexpected: string[] = []; page.on('request', r => { unexpected.push(r.url()); });
  await page.getByRole('button', { name: 'Add conversation', exact: true }).click(); await page.getByLabel('Conversation text').fill('User: <img src="https://invalid.test/pixel" onerror="alert(1)">');
  await page.getByRole('button', { name: 'Preview source', exact: true }).click(); await expect(page.locator('img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Prepare analysis', exact: true }).click(); await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  expect(unexpected).toEqual([]);
});
