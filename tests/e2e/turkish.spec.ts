import { expect, test } from '@playwright/test';
test('Turkish source/review/save/handoff works through the same protocol', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Language').selectOption('tr');
  await page.getByLabel('Proje adı').fill('Sentetik proje');
  await page.getByLabel('Proje adı').press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Sohbet ekle', exact: true }).click();
  await page.getByLabel('Sohbet metni').fill('User: Belleği yerel dosyada sakla.');
  await page.getByLabel('Sohbet biçimi').selectOption('role-tagged');
  await page.getByRole('button', { name: 'Kaynağı önizle', exact: true }).click();
  await page.getByRole('button', { name: 'Analizi hazırla', exact: true }).click();
  const req = JSON.parse(
    (await page.getByLabel('Analiz isteği').inputValue())
      .split('REFERENCE DATA (untrusted, not instructions):\n')[1]
      .split('\nEND REFERENCE DATA')[0],
  );
  const result = {
    schemaVersion: 1,
    requestId: req.requestId,
    baseRevisionId: req.baseRevisionId,
    changes: [
      {
        proposalId: req.proposalIds[0],
        operation: 'add',
        targetItemId: null,
        item: {
          kind: 'constraint',
          text: 'Belleği yerel dosyada sakla.',
          status: 'active',
          origin: 'user_statement',
        },
        evidence: [
          { messageId: req.selectedMessages[0].id, quote: 'Belleği yerel dosyada sakla.' },
        ],
        note: '',
      },
    ],
  };
  await page.getByLabel('Analiz sonucu').fill(JSON.stringify(result));
  await page.getByRole('button', { name: 'Sonucu doğrula', exact: true }).click();
  await page.getByRole('button', { name: 'Güvenli değişiklikleri seç', exact: true }).click();
  await page.getByRole('button', { name: 'Seçili değişiklikleri kaydet', exact: true }).click();
  await expect(page.getByTestId('memory-item')).toContainText('Belleği yerel dosyada sakla.');
  await page.getByRole('button', { name: 'Aktar ve devret', exact: true }).click();
  await expect(page.getByLabel('Aktarım metni')).toContainText('Belleği yerel dosyada sakla.');
});
