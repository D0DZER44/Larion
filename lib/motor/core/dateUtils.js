/**
 * Small date helpers kept independent from framework and storage.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toDate(value = Date.now()) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string" && value.includes("T")) return new Date(value);
  if (typeof value === "string") return new Date(`${value}T00:00:00`);
  return new Date();
}

export function toTimestamp(value = Date.now()) {
  return toDate(value).getTime();
}

export function toIsoDate(value = Date.now()) {
  return toDate(value).toISOString().split("T")[0];
}

export function addDays(value, days = 0) {
  const next = toDate(value);
  next.setDate(next.getDate() + days);
  return next;
}

export function addDaysToIso(value, days = 0) {
  return toIsoDate(addDays(value, days));
}

export function diffInDays(fromValue, toValue = Date.now()) {
  const from = toTimestamp(fromValue);
  const to = toTimestamp(toValue);
  return Math.floor((to - from) / MS_PER_DAY);
}

export function compareIsoDate(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function isOverdue(isoDate, referenceDate = Date.now()) {
  return compareIsoDate(isoDate, toIsoDate(referenceDate)) < 0;
}

export function startOfWeekIso(value = Date.now()) {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return toIsoDate(date);
}

export function startOfMonthIso(value = Date.now()) {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  return toIsoDate(date);
}

export function getYearMonthKey(value = Date.now()) {
  const date = toDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getYearWeekKey(value = Date.now()) {
  const start = toDate(startOfWeekIso(value));
  const year = start.getFullYear();
  const firstDay = new Date(year, 0, 1);
  const diff = Math.floor((start.getTime() - firstDay.getTime()) / MS_PER_DAY);
  const week = Math.floor(diff / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}
