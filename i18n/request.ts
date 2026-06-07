import { getRequestConfig } from "next-intl/server";

export const defaultLocale = "en";
export const locales = [defaultLocale] as const;

export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: (await import(`../messages/${defaultLocale}.json`)).default,
}));
