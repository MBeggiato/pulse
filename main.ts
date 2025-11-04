import type { Config } from "./types.ts";
import { loadTranslations, t } from "./i18n.ts";
import { loadConfig, watchConfig } from "./config.ts";
import { performChecks } from "./checker.ts";

async function main(): Promise<void> {
  // Übersetzungen laden
  await loadTranslations();

  console.log(t("app_started"));

  let config = await loadConfig();
  const intervalSeconds = config.interval ?? 60;
  const intervalMs = intervalSeconds * 1000;

  console.log(t("watching_interval", { interval: intervalSeconds }));

  if (config.autoDiscover?.enabled) {
    console.log(
      t("auto_discover_enabled", { labelKey: config.autoDiscover.labelKey })
    );
  }

  console.log("");

  // Config-Datei überwachen und bei Änderungen neu laden
  watchConfig((newConfig: Config) => {
    config = newConfig;
  });

  // Erste Prüfung sofort durchführen
  await performChecks(config);

  // Danach alle X Sekunden prüfen
  setInterval(async () => {
    await performChecks(config);
  }, intervalMs);
}

if (import.meta.main) {
  main();
}
