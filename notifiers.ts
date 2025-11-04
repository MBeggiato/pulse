import type { Notifier, WebhookNotifier, NtfyNotifier } from "./types.ts";
import { t } from "./i18n.ts";

export async function notify(
  notifier: Notifier,
  containerName: string,
  isRunning: boolean,
  globalNtfyServer?: string
): Promise<void> {
  try {
    switch (notifier.type) {
      case "webhook":
        await notifyWebhook(notifier, containerName, isRunning);
        break;
      case "ntfy":
        await notifyNtfy(notifier, containerName, isRunning, globalNtfyServer);
        break;
    }
  } catch (error) {
    console.error(
      `  ${t("notifier_error", { type: notifier.type, name: containerName })}`,
      error
    );
  }
}

async function notifyWebhook(
  notifier: WebhookNotifier,
  containerName: string,
  isRunning: boolean
): Promise<void> {
  const method = notifier.method || "POST";
  const timestamp = new Date().toISOString();
  const status = isRunning ? "running" : "stopped";

  let body: string | undefined;
  if (method === "POST") {
    const template =
      notifier.bodyTemplate ||
      '{"container":"{name}","status":"{status}","timestamp":"{timestamp}"}';

    body = template
      .replace("{name}", containerName)
      .replace("{status}", status)
      .replace("{timestamp}", timestamp);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...notifier.headers,
  };

  const response = await fetch(notifier.url, {
    method,
    headers,
    body,
  });

  if (response.ok) {
    console.log(
      `  ${t("notifier_success", { type: "Webhook", status: response.status })}`
    );
  } else {
    console.warn(
      `  ${t("notifier_failed", { type: "Webhook", status: response.status })}`
    );
  }
}

async function notifyNtfy(
  notifier: NtfyNotifier,
  containerName: string,
  isRunning: boolean,
  globalNtfyServer?: string
): Promise<void> {
  const server = notifier.server || globalNtfyServer || "https://ntfy.sh";
  const url = `${server}/${notifier.topic}`;
  const statusText = isRunning ? "Running" : "Stopped";
  const emoji = isRunning ? "✅" : "❌";
  const priority = notifier.priority || "default";

  const headers: Record<string, string> = {
    Title: `Container: ${containerName}`,
    Priority: priority,
  };

  if (notifier.tags && notifier.tags.length > 0) {
    headers["Tags"] = notifier.tags.join(",");
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: `${emoji} ${containerName} is ${statusText}`,
  });

  if (response.ok) {
    console.log(
      `  ${t("notifier_success", { type: "ntfy", status: response.status })}`
    );
  } else {
    console.warn(
      `  ${t("notifier_failed", { type: "ntfy", status: response.status })}`
    );
  }
}
