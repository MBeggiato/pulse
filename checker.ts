import type { Config } from "./types.ts";
import { t, getDateLocale } from "./i18n.ts";
import { checkDockerContainer, discoverContainersWithLabel } from "./docker.ts";
import { notify } from "./notifiers.ts";
import { getLastStatus, updateStatus, hasStatusChanged } from "./state.ts";

export async function performChecks(config: Config): Promise<void> {
  const time = new Date().toLocaleString(getDateLocale());
  console.log(`\n${t("check_performed", { time })}`);

  let allChecks = [...config.checks];

  // Auto-Discovery: Container mit Labels automatisch hinzufügen
  if (config.autoDiscover?.enabled) {
    const discoveredChecks = await discoverContainersWithLabel(
      config.autoDiscover.labelKey
    );

    if (discoveredChecks.length > 0) {
      // Doppelte Container vermeiden (manuelle Config hat Vorrang)
      const manualNames = new Set(config.checks.map((c) => c.name));
      const newChecks = discoveredChecks.filter(
        (c) => !manualNames.has(c.name)
      );
      allChecks = [...allChecks, ...newChecks];
    }
  }

  for (const check of allChecks) {
    const isRunning = await checkDockerContainer(check.name);

    if (isRunning) {
      console.log(t("container_running", { name: check.name }));
    } else {
      console.log(t("container_stopped", { name: check.name }));
    }

    // Status-Änderung prüfen
    const statusChanged = hasStatusChanged(check.name, isRunning);

    // Alle konfigurierten Notifier aufrufen
    for (const notifier of check.notifiers) {
      // Standard-Verhalten je nach Notifier-Typ
      const defaultNotifyOn = notifier.type === "webhook" ? "always" : "change";
      const notifyOn = notifier.notifyOn || defaultNotifyOn;

      // Entscheiden ob benachrichtigt werden soll
      const shouldNotify =
        notifyOn === "always" ||
        (notifyOn === "change" &&
          (statusChanged || getLastStatus(check.name) === undefined));

      if (shouldNotify) {
        await notify(notifier, check.name, isRunning, config.ntfyServer);
      }
    }

    // Status für nächsten Check speichern
    updateStatus(check.name, isRunning);
  }
}
