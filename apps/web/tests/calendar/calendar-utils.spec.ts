import { describe, expect, it } from "vitest";
import {
  calendarDays,
  calendarRange,
  shiftCalendarAnchor,
  startOfCalendarWeek,
  toLocalDateTimeInput,
  zonedDateKey,
} from "~/utils/calendar";

describe("calendar utilities", () => {
  it("builds month and Monday-based week ranges", () => {
    expect(calendarRange("2026-07-22", "month")).toEqual({
      start: "2026-07-01T00:00",
      end: "2026-08-01T00:00",
    });
    expect(startOfCalendarWeek("2026-07-22")).toBe("2026-07-20");
    expect(calendarDays("2026-07-22", "week")).toHaveLength(7);
  });

  it("shifts end-of-month anchors without skipping February", () => {
    expect(shiftCalendarAnchor("2026-01-31", "month", 1)).toBe("2026-02-28");
    expect(shiftCalendarAnchor("2026-02-28", "month", -1)).toBe("2026-01-28");
  });

  it("formats UTC events in the selected timezone around DST", () => {
    expect(zonedDateKey("2026-03-29T22:30:00.000Z", "Europe/Paris")).toBe(
      "2026-03-30",
    );
    expect(
      toLocalDateTimeInput("2026-03-30T07:00:00.000Z", "Europe/Paris"),
    ).toBe("2026-03-30T09:00");
  });
});
