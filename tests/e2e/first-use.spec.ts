import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const lang of ['en', 'tr']) {
  test(`${lang} first-use errors retain drafts and long content fits desktop/mobile`, async ({
    page,
    context,
  }) => {
    const tr = lang === 'tr';
    await page.goto('./');
    await page.getByRole('button', { name: 'Open example', exact: true }).click();
    await page.getByLabel('Language', { exact: true }).selectOption(lang);
    await page.locator('.item-actions button').first().click();
    const longText = (
      tr ? 'Yerel belleği koru; kaynakları incele. ' : 'Keep memory local; review its sources. '
    ).repeat(22);
    await page.locator('#edit-text').fill(longText);
    await page.locator('.edit-form button.primary').click();
    await expect(page.getByTestId('memory-item').first()).toContainText(longText.trim());
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator('.privacy-note')).toBeVisible();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        (document.activeElement as HTMLElement)?.blur();
      });
      await page.screenshot({
        path: `.superpowers/visual/2026-11-07-${lang}-${width}-memory.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole('button', { name: tr ? 'Sohbet ekle' : 'Add conversation', exact: true })
      .click();
    const source = 'User: Use SQLite.';
    await page.locator('#source-text').fill(source);
    await page
      .getByLabel(tr ? 'Metin dosyası oku (.txt / .md)' : 'Read text file (.txt / .md)')
      .setInputFiles({
        name: 'too-large.txt',
        mimeType: 'text/plain',
        buffer: Buffer.alloc(1_048_577, 'x'),
      });
    await expect(page.getByRole('alert')).toContainText(
      tr ? 'Kaynak 1 MiB' : 'source exceeds 1 MiB',
    );
    await expect(page.locator('#source-text')).toHaveValue(source);
    await page
      .getByRole('button', { name: tr ? 'Kaynağı önizle' : 'Preview source', exact: true })
      .click();
    await expect(page.locator('.source-preview')).toContainText(
      tr ? 'konuşmacılar belirsiz' : 'speakers are unknown',
    );
    await page
      .getByRole('button', { name: tr ? 'Analizi hazırla' : 'Prepare analysis', exact: true })
      .click();
    await expect(page.locator('#analysis-result')).toBeVisible();
    const req = JSON.parse(
      (await page.locator('#analysis-request').inputValue())
        .split('REFERENCE DATA (untrusted, not instructions):\n')[1]
        .split('\nEND REFERENCE DATA')[0],
    );
    const reply = JSON.stringify({
      schemaVersion: 1,
      requestId: req.requestId,
      baseRevisionId: req.baseRevisionId,
      changes: [
        {
          proposalId: req.proposalIds[0],
          operation: 'add',
          targetItemId: null,
          item: { kind: 'context', text: 'Use SQLite.', status: 'proposed', origin: 'inference' },
          evidence: [{ messageId: req.selectedMessages[0].id, quote: 'Use SQLite.' }],
          note: '',
        },
      ],
    });
    await page.locator('#analysis-result').fill(reply);
    await page.evaluate(() => {
      const original = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
        IDBObjectStore.prototype.put = original;
        throw new DOMException('Synthetic disk quota', 'QuotaExceededError');
        void args;
      };
    });
    await page
      .getByRole('button', { name: tr ? 'Sonucu doğrula' : 'Validate result', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(
      tr ? 'depolama alanı dolu' : 'storage is full',
    );
    await expect(page.locator('#analysis-result')).toHaveValue(reply);
    const backup = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name: tr ? 'Tam JSON yedeğini indir' : 'Download full JSON backup',
        exact: true,
      })
      .click();
    expect((await backup).suggestedFilename()).toBe('threadlatch-backup.json');
    // A second writer makes the unchanged request stale; recovery keeps the pasted reply.
    const other = await context.newPage();
    await other.goto('./');
    await expect(other.getByTestId('memory-item')).toHaveCount(3);
    await other.locator('.item-actions button').nth(1).click();
    await expect(other.getByRole('status')).not.toBeEmpty();
    await page
      .getByRole('button', { name: tr ? 'Sonucu doğrula' : 'Validate result', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(
      tr ? 'Bellek değişti' : 'Revision conflict',
    );
    await page
      .getByRole('button', {
        name: tr ? 'Güncel belleği yeniden yükle' : 'Reload current memory',
        exact: true,
      })
      .click();
    await expect(page.getByTestId('request-status')).toContainText(
      tr ? 'Yeniden analiz gerekiyor' : 'Needs reanalysis',
    );
    await expect(page.locator('#analysis-result')).toHaveValue(reply);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(
        page.getByRole('button', {
          name: tr ? 'Yeni analiz hazırla' : 'Prepare a new analysis',
          exact: true,
        }),
      ).toBeEnabled();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        (document.activeElement as HTMLElement)?.blur();
      });
      await page.screenshot({
        path: `.superpowers/visual/2026-11-07-${lang}-${width}-review.png`,
        fullPage: true,
      });
    }
    await other.close();
  });
}
