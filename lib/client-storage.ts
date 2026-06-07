"use client";

export function closeSidebarDrawer() {
  window.dispatchEvent(new Event("close-sidebar"));
}

export function removeCachedSourceName(name: string) {
  const existing = JSON.parse(localStorage.getItem("sources") || "[]") as string[];
  const updated = existing.filter((item) => item !== name);

  localStorage.setItem("sources", JSON.stringify(updated));
}

export function resetLocalChat() {
  localStorage.removeItem("chat_messages");
  window.location.reload();
}
