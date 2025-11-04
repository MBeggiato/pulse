export type NotifierType = "webhook" | "ntfy";

export type NotifyOn = "always" | "change";

export interface WebhookNotifier {
  type: "webhook";
  url: string; // Webhook URL
  method?: "GET" | "POST"; // HTTP Methode, Standard: POST
  headers?: Record<string, string>; // Custom Headers
  bodyTemplate?: string; // JSON Template mit Platzhaltern: {name}, {status}, {timestamp}
  notifyOn?: NotifyOn; // Wann benachrichtigen: "always" oder "change" (Standard: "always")
}

export interface NtfyNotifier {
  type: "ntfy";
  topic: string; // ntfy Topic
  server?: string; // ntfy Server URL, Standard: https://ntfy.sh
  priority?: "max" | "high" | "default" | "low" | "min";
  tags?: string[]; // Emoji Tags
  notifyOn?: NotifyOn; // Wann benachrichtigen: "always" oder "change" (Standard: "change")
}

export type Notifier = WebhookNotifier | NtfyNotifier;

export interface Check {
  name: string;
  notifiers: Notifier[];
}

export interface Config {
  interval?: number; // Intervall in Sekunden, Standard: 60
  locale?: string; // Sprache: de, en, etc. Standard: de
  dateFormat?: string; // Datums-Locale für toLocaleString, Standard: de-DE
  ntfyServer?: string; // Globaler ntfy Server, Standard: https://ntfy.sh
  autoDiscover?: {
    enabled: boolean;
    labelKey: string; // Label-Name, z.B. "pulse.monitor"
  };
  checks: Check[];
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}
