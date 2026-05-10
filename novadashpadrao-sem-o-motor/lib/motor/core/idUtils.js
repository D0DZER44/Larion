/**
 * Id and key helpers for pure JavaScript modules.
 */

export function generateId(prefix = "ID") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stableKey(parts = []) {
  return parts
    .filter((part) => part !== undefined && part !== null && String(part).trim() !== "")
    .map((part) => slugify(String(part)))
    .join(":");
}
