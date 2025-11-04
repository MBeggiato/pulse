import type { Config } from "./types.ts";
import { t, setLocale, setDateLocale } from "./i18n.ts";

export async function loadConfig(): Promise<Config> {
  try {
    const content = await Deno.readTextFile("./config.json");
    const config = JSON.parse(content);

    // Lokalisierungseinstellungen aktualisieren
    setLocale(config.locale ?? "de");
    setDateLocale(config.dateFormat ?? "de-DE");

    return config;
  } catch (error) {
    console.error(t("config_read_error"), error);
    throw error;
  }
}

export async function watchConfig(
  onReload: (config: Config) => void
): Promise<void> {
  const configWatcher = Deno.watchFs("./config.json");
  for await (const event of configWatcher) {
    if (event.kind === "modify") {
      console.log(`\n${t("config_changed")}`);
      try {
        const config = await loadConfig();
        console.log(t("config_reloaded") + "\n");
        onReload(config);
      } catch (error) {
        console.error(t("config_reload_error"), error);
      }
    }
  }
}
