import { expect, test } from '@playwright/test';
test('two tabs preserve the first writer and surface the stale second writer', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  const other = await context.newPage();
  await other.goto('./');
  await expect(other.getByTestId('memory-item')).toHaveCount(3);
  for (const tab of [page, other]) {
    await tab.getByRole('button', { name: 'Edit manually', exact: true }).first().click();
  }
  await page.getByLabel('Memory text').fill('First writer wins.');
  await page.getByRole('button', { name: 'Save manual edit', exact: true }).click();
  await other.getByLabel('Memory text').fill('Stale overwrite.');
  await other.getByRole('button', { name: 'Save manual edit', exact: true }).click();
  await expect(other.getByRole('alert')).toContainText('Revision conflict');
  await other.reload();
  await expect(other.getByTestId('memory-item').first()).toContainText('First writer wins.');
});
test('quota failure rolls back; corrupt/dangling-source backups leave current memory intact', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
      IDBObjectStore.prototype.put = original;
      throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
      void args;
    };
  });
  await page.getByRole('button', { name: 'Pin item', exact: true }).first().click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('memory-item').first()).toContainText(
    'Keep project memory on this device.',
  );
  await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  await page
    .getByLabel('Import JSON backup')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{broken'),
    });
  await expect(page.getByRole('alert')).toContainText('Invalid JSON');
  await page.getByRole('button', { name: 'Current memory', exact: true }).click();
  await expect(page.getByTestId('memory-item')).toHaveCount(3);
});
test('history restoration appends a revision and keyboard deletion dialog returns focus', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  await page.getByRole('button', { name: 'Edit manually', exact: true }).first().click();
  await page.getByLabel('Memory text').fill('Temporary edit.');
  await page.getByRole('button', { name: 'Save manual edit', exact: true }).click();
  await page.getByRole('button', { name: 'Sources & history', exact: true }).click();
  await page.getByRole('button', { name: 'Restore as new revision', exact: true }).first().click();
  await page.getByRole('button', { name: 'Current memory', exact: true }).click();
  await expect(page.getByTestId('memory-item').first()).toContainText(
    'Keep project memory on this device.',
  );
  await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Delete project', exact: true })).toBeFocused();
});
