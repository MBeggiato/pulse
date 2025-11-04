import type { Translations } from "./types.ts";

let translations: Translations = {};
let currentLocale = "de";
let dateLocale = "de-DE";

export async function loadTranslations(): Promise<void> {
  try {
    const content = await Deno.readTextFile("./locales.json");
    translations = JSON.parse(content);
  } catch (error) {
    console.error("Error loading translations:", error);
    // Fallback zu leeren Übersetzungen
    translations = { de: {}, en: {} };
  }
}

export function t(
  key: string,
  params?: Record<string, string | number>
): string {
  let text =
    translations[currentLocale]?.[key] || translations["de"]?.[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }

  return text;
}

export function setLocale(locale: string): void {
  currentLocale = locale;
}

export function setDateLocale(locale: string): void {
  dateLocale = locale;
}

export function getDateLocale(): string {
  return dateLocale;
}
