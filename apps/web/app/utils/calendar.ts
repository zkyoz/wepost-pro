import type { CalendarViewMode } from "~/types/calendar";

function asUtcDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addCalendarDays(value: string, days: number) {
  const date = asUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

export function startOfCalendarWeek(value: string) {
  const date = asUtcDate(value);
  const offset = (date.getUTCDay() + 6) % 7;
  return addCalendarDays(value, -offset);
}

export function calendarRange(anchor: string, view: CalendarViewMode) {
  if (view === "week") {
    const start = startOfCalendarWeek(anchor);
    return {
      start: `${start}T00:00`,
      end: `${addCalendarDays(start, 7)}T00:00`,
    };
  }
  const [year, month] = anchor.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(year!, month!, 1, 12));
  return { start: `${start}T00:00`, end: `${dateKey(next)}T00:00` };
}

export function calendarDays(anchor: string, view: CalendarViewMode) {
  const range = calendarRange(anchor, view);
  const days: string[] = [];
  for (
    let day = range.start.slice(0, 10);
    day < range.end.slice(0, 10);
    day = addCalendarDays(day, 1)
  ) {
    days.push(day);
  }
  return days;
}

export function shiftCalendarAnchor(
  anchor: string,
  view: CalendarViewMode,
  direction: -1 | 1,
) {
  if (view === "week") return addCalendarDays(anchor, direction * 7);
  const date = asUtcDate(anchor);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction);
  const month = date.getUTCMonth();
  date.setUTCMonth(month + 1, 0);
  date.setUTCDate(Math.min(day, date.getUTCDate()));
  return dateKey(date);
}

export function zonedDateKey(iso: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function toLocalDateTimeInput(iso: string | null, timezone: string) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
