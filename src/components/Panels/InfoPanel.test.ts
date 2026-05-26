import { describe, expect, it } from "vitest";
import { formatTotalPauseDuration } from "./InfoPanel";
import type { unitTimeSpan } from "../../customObject/TimeSpan";

const units: unitTimeSpan = { days: "J ", hours: "H ", minutes: "MIN ", seconds: "S ", milliseconds: "MS " };

describe("formatTotalPauseDuration()", () => {
  it("formate une pause cumulee en minutes", () => {
    expect(formatTotalPauseDuration(20 * 60, units)).toBe("0H 20MIN ");
  });

  it("formate plusieurs pauses cumulees", () => {
    expect(formatTotalPauseDuration((60 + 15) * 60, units)).toBe("1H 15MIN ");
  });
});
