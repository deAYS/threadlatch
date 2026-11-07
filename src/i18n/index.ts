import { en } from './en.js';
import { tr } from './tr.js';
export type Language = 'en' | 'tr';
export type TranslationKey = keyof typeof en;
export const dictionaries = { en, tr };
