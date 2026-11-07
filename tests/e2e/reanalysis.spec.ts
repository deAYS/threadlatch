import { expect, test } from '@playwright/test';
test('can retry an imported analysis and manually review a proposed item status', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  await page.getByRole('button', { name: 'Review changes', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare a new analysis', exact: true }).click();
  await expect(page.getByLabel('Analysis result')).toBeVisible();
  await page.getByRole('button', { name: 'Current memory', exact: true }).click();
  const proposed = page
    .getByTestId('memory-item')
    .filter({ hasText: 'Cloud sync is a suggestion for later.' });
  await proposed.getByRole('button', { name: 'Edit manually', exact: true }).click();
  await page.getByLabel('Status', { exact: true }).selectOption('rejected');
  await page.getByRole('button', { name: 'Save manual edit', exact: true }).click();
  await expect(page.getByTestId('memory-item')).toHaveCount(2);
});
