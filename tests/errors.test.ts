import { expect, it } from "vitest";
import { safeCheckoutError, isErrorKind } from "../src/lib/errors";
it("hides database and credential details from public responses", () => {
  const secret = "postgres://password@internal-host";
  expect(safeCheckoutError(new Error(secret))).toMatchObject({ code: "500", status: 500 });
  expect(safeCheckoutError(new Error(secret)).message).not.toContain(secret);
  expect(safeCheckoutError(new Error("Mercado Pago recusou token secret"))).toMatchObject({ code: "pagamento", status: 502 });
});
it("preserves actionable conflict and timeout distinctions", () => {
  expect(safeCheckoutError(new Error("NUMBERS_UNAVAILABLE")).status).toBe(409);
  const timeout = new Error(); timeout.name = "TimeoutError";
  expect(safeCheckoutError(timeout).status).toBe(504);
  expect(isErrorKind("conexao")).toBe(true); expect(isErrorKind("unknown")).toBe(false); expect(isErrorKind("constructor")).toBe(false);
});

