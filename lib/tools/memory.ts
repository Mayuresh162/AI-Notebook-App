export type MemoryItem = {
  key: string;
  value: string;
};

export function getMemory(): MemoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      localStorage.getItem("memory") || "[]"
    );
  } catch {
    return [];
  }
}

export function setMemory(
  items: MemoryItem[]
) {
  localStorage.setItem(
    "memory",
    JSON.stringify(items)
  );
}

export function addMemory(
  key: string,
  value: string
) {
  const existing = getMemory();

  const filtered =
    existing.filter(
      (m) => m.key !== key
    );

  filtered.push({ key, value });

  setMemory(filtered);
}

export function clearMemory() {
  localStorage.removeItem("memory");
}