import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('EN/TR, mobile layout, keyboard focus and automated accessibility', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Language').selectOption('tr');
  await expect(page.getByRole('heading', { name: 'Güncel bellek', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Güncel bellek', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
