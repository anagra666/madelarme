import type { Settings } from "@/content/types";
import settingsJson from "@/content/settings.json";

/** Отдельный модуль: клиентские компоненты (ссылки, шапка) не тянут за собой все JSON кейсов. */
export const settings = settingsJson as Settings;
