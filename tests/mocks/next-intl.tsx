import messages from "@/messages/en.json";

type Messages = Record<string, unknown>;

function getNestedValue(namespace: string, key: string) {
  const path = namespace ? `${namespace}.${key}` : key;

  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;

    return (value as Messages)[segment];
  }, messages);
}

function interpolate(value: string, params?: Record<string, string | number>) {
  if (!params) return value;

  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

export function useTranslations(namespace = "") {
  return (key: string, params?: Record<string, string | number>) => {
    const value = getNestedValue(namespace, key);

    if (typeof value !== "string") return key;

    return interpolate(value, params);
  };
}

export function NextIntlClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
