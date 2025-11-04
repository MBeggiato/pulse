import { t } from "./i18n.ts";

export async function callUrl(url: string, checkName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`  ${t("url_called", { url, status: response.status })}`);
    } else {
      console.warn(`  ${t("url_failed", { url, status: response.status })}`);
    }
  } catch (error) {
    console.error(`  ${t("url_error", { name: checkName })}`, error);
  }
}
