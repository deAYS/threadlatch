import { expect, test, type Page } from '@playwright/test';

async function requestData(page: Page) {
  return JSON.parse(
    (await page.getByLabel('Analysis request').inputValue())
      .split('REFERENCE DATA (untrusted, not instructions):\n')[1]
      .split('\nEND REFERENCE DATA')[0],
  );
}

for (const splitIndex of [0, 1, 2]) {
  test(`split message ${splitIndex + 1} preserves excluded source in the final analysis`, async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByLabel('Project name').fill('Selection regression');
    await page.getByRole('button', { name: 'Create project', exact: true }).click();
    await page.getByRole('button', { name: 'Add conversation', exact: true }).click();
    await page
      .getByLabel('Conversation text')
      .fill('User: Public abcdef\nAssistant: Excluded synthetic message.\nUser: Public later');
    await page.getByLabel('Transcript format').selectOption('role-tagged');
    await page.getByRole('button', { name: 'Preview source', exact: true }).click();
    await page.locator('.draft-message').nth(1).getByRole('checkbox').uncheck();
    const text = page.getByRole('textbox', { name: `Message ${splitIndex + 1}`, exact: true });
    await text.focus();
    await text.press('Home');
    await text.press('ArrowRight');
    await text.press('ArrowRight');
    await page
      .locator('.draft-message')
      .nth(splitIndex)
      .getByRole('button', { name: 'Split at cursor' })
      .click();
    const firstPiece = page.getByRole('textbox', { name: 'Message 1', exact: true });
    await firstPiece.focus();
    await firstPiece.press('Home');
    await firstPiece.press('ArrowRight');
    await page
      .locator('.draft-message')
      .first()
      .getByRole('button', { name: 'Split at cursor' })
      .click();
    await page.getByRole('button', { name: 'Prepare analysis', exact: true }).click();
    const req = await requestData(page);
    expect(req.selectedMessages.map((m: { text: string }) => m.text).join('')).toBe(
      'Public abcdefPublic later',
    );
    expect(req.selectedMessages).toHaveLength(splitIndex === 1 ? 3 : 4);
  });
}

test('explicit analysis and handoff scopes reconcile after rejecting an item without expanding', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Open example', exact: true }).click();
  await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  await page.getByText('Handoff scope', { exact: false }).click();
  await page.locator('.memory-scope').getByLabel('Cloud sync is a suggestion for later.').uncheck();
  await page.getByRole('button', { name: 'Review changes', exact: true }).click();
  await page.getByText('Memory scope for analysis', { exact: false }).click();
  await page.locator('.memory-scope').getByLabel('Cloud sync is a suggestion for later.').uncheck();
  await page.getByRole('button', { name: 'Current memory', exact: true }).click();
  await page
    .getByTestId('memory-item')
    .first()
    .getByRole('button', { name: 'Edit manually', exact: true })
    .click();
  await page.getByLabel('Status', { exact: true }).selectOption('rejected');
  await page.getByRole('button', { name: 'Save manual edit', exact: true }).click();
  await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  await expect(page.locator('.memory-scope summary')).toContainText('1/2');
  const handoff = await page.getByLabel('Handoff text').inputValue();
  expect(handoff).toContain('Which format should the handoff use?');
  expect(handoff).not.toContain('Cloud sync');
  await page.getByRole('button', { name: 'Review changes', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare a new analysis', exact: true }).click();
  await expect(page.getByLabel('Analysis result')).toBeVisible();
  const req = await requestData(page);
  expect(req.currentItems.map((i: { text: string }) => i.text)).toEqual([
    'Which format should the handoff use?',
  ]);
  await page.getByRole('button', { name: 'Sources & history', exact: true }).click();
  await page.getByRole('button', { name: 'Restore as new revision', exact: true }).first().click();
  await page.getByRole('button', { name: 'Export & handoff', exact: true }).click();
  await expect(page.locator('.memory-scope summary')).toContainText('1/3');
  const restored = await page.getByLabel('Handoff text').inputValue();
  expect(restored).toContain('Which format should the handoff use?');
  expect(restored).not.toContain('Keep project memory on this device.');
});
