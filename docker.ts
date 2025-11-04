import type { Check, Notifier } from "./types.ts";
import { t } from "./i18n.ts";

export async function checkDockerContainer(
  containerName: string
): Promise<boolean> {
  try {
    const command = new Deno.Command("docker", {
      args: ["ps", "-q", "-f", `name=${containerName}`],
    });

    const { stdout } = await command.output();
    const output = new TextDecoder().decode(stdout).trim();

    return output.length > 0;
  } catch (error) {
    console.error(t("container_check_error", { name: containerName }), error);
    return false;
  }
}

export async function discoverContainersWithLabel(
  labelKey: string
): Promise<Check[]> {
  try {
    // Alle Container mit dem Label finden (laufend und gestoppt)
    const command = new Deno.Command("docker", {
      args: [
        "ps",
        "-a",
        "--filter",
        `label=${labelKey}`,
        "--format",
        '{{.Names}}\t{{.Label "' + labelKey + '"}}',
      ],
    });

    const { stdout } = await command.output();
    const output = new TextDecoder().decode(stdout).trim();

    if (!output) {
      return [];
    }

    const checks: Check[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const [name, labelValue] = line.split("\t");
      if (name && labelValue) {
        // Label-Format parsen und Webhook Notifier erstellen
        const notifiers = parseLabelUrls(labelValue);
        if (notifiers.length > 0) {
          checks.push({
            name: name.trim(),
            notifiers: notifiers,
          });
        }
      }
    }

    return checks;
  } catch (error) {
    console.error(t("container_discovery_error"), error);
    return [];
  }
}

function parseLabelUrls(labelValue: string): Notifier[] {
  const notifiers: Notifier[] = [];

  // Versuche als JSON zu parsen (empfohlenes Format)
  if (labelValue.trim().startsWith("[") || labelValue.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(labelValue);
      // Einzelner Notifier als Object
      if (parsed.type) {
        notifiers.push(parsed as Notifier);
      }
      // Array von Notifiern
      else if (Array.isArray(parsed)) {
        notifiers.push(...parsed);
      }
      return notifiers;
    } catch {
      // Fallback zu altem Format
    }
  }

  // Versuche als URL zu parsen (einfaches Format - Webhook GET)
  if (labelValue.startsWith("http://") || labelValue.startsWith("https://")) {
    notifiers.push({
      type: "webhook",
      url: labelValue,
      method: "GET",
    });
    return notifiers;
  }

  // Parse key=value Format (Legacy)
  const parts = labelValue.split(",");
  let webhookUrl: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => s.trim());

    if (key === "webhook" || key === "url") {
      webhookUrl = value;
    }
  }

  if (webhookUrl) {
    notifiers.push({
      type: "webhook",
      url: webhookUrl,
      method: "GET",
    });
  }

  return notifiers;
}
