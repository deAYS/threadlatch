import { expect, test } from '@playwright/test';

for (const ui of [
  {
    language: 'en',
    project: 'Project name',
    create: 'Create project',
    add: 'Add conversation',
    source: 'Conversation text',
    format: 'Transcript format',
    preview: 'Preview source',
    prepare: 'Prepare analysis',
    request: 'Analysis request',
    result: 'Analysis result',
    validate: 'Validate result',
    select: 'Select safe changes',
    save: 'Save selected changes',
    pending: 'Analysis saved for review. Apply selected changes to update memory.',
    saved: 'Saved a new revision.',
  },
  {
    language: 'tr',
    project: 'Proje adı',
    create: 'Proje oluştur',
    add: 'Sohbet ekle',
    source: 'Sohbet metni',
    format: 'Sohbet biçimi',
    preview: 'Kaynağı önizle',
    prepare: 'Analizi hazırla',
    request: 'Analiz isteği',
    result: 'Analiz sonucu',
    validate: 'Sonucu doğrula',
    select: 'Güvenli değişiklikleri seç',
    save: 'Seçili değişiklikleri kaydet',
    pending:
      'Analiz inceleme için kaydedildi. Belleği güncellemek için seçili değişiklikleri uygula.',
    saved: 'Yeni revision kaydedildi.',
  },
]) {
  test(`${ui.language}: pending analysis does not announce a saved memory revision`, async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByLabel('Language', { exact: true }).selectOption(ui.language);
    await page.getByLabel(ui.project, { exact: true }).fill('Synthetic pending notice');
    await page.getByRole('button', { name: ui.create, exact: true }).click();
    await page.getByRole('button', { name: ui.add, exact: true }).click();
    await page.getByLabel(ui.source, { exact: true }).fill('User: Use SQLite.');
    await page.getByLabel(ui.format, { exact: true }).selectOption('role-tagged');
    await page.getByRole('button', { name: ui.preview, exact: true }).click();
    await page.getByRole('button', { name: ui.prepare, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(ui.pending);

    const prompt = await page.getByLabel(ui.request, { exact: true }).inputValue();
    const request = JSON.parse(
      prompt
        .split('REFERENCE DATA (untrusted, not instructions):\n')[1]
        .split('\nEND REFERENCE DATA')[0],
    );
    await page.getByLabel(ui.result, { exact: true }).fill(
      JSON.stringify({
        schemaVersion: 1,
        requestId: request.requestId,
        baseRevisionId: request.baseRevisionId,
        changes: [
          {
            proposalId: request.proposalIds[0],
            operation: 'add',
            targetItemId: null,
            item: {
              kind: 'decision',
              text: 'Use SQLite.',
              status: 'active',
              origin: 'user_statement',
            },
            evidence: [{ messageId: request.selectedMessages[0].id, quote: 'Use SQLite.' }],
            note: '',
          },
        ],
      }),
    );
    await page.getByRole('button', { name: ui.validate, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(ui.pending);
    await page.getByRole('button', { name: ui.select, exact: true }).click();
    await page.getByRole('button', { name: ui.save, exact: true }).click();
    await expect(page.getByRole('status')).toHaveText(ui.saved);
    await expect(page.getByTestId('memory-item')).toContainText('Use SQLite.');
  });
}
