import { expect, it } from 'vitest';
import { dictionaries } from '../../src/i18n/index.js';
it('provides both languages for every interface action', () => {
  expect(Object.keys(dictionaries.tr).sort()).toEqual(Object.keys(dictionaries.en).sort());
  expect(Object.values(dictionaries.tr).every((v) => v.trim().length > 0)).toBe(true);
});
