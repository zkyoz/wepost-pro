import { describe, expect, it } from "vitest";
import { getApiErrors, getStatusCode } from "~/utils/api-errors";

describe("API error mapping", () => {
  it("extracts field validation errors for accessible display", () => {
    const errors = getApiErrors({
      data: { errors: [{ field: "email", message: "Adresse déjà utilisée." }] },
    });
    expect(errors).toEqual([
      { field: "email", message: "Adresse déjà utilisée." },
    ]);
  });

  it("reads HTTP status codes from fetch errors", () => {
    expect(getStatusCode({ response: { status: 503 } })).toBe(503);
  });
});
