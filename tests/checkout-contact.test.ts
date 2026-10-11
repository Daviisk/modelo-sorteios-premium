import { expect, it } from "vitest";
import { checkoutContactSchema, formatMobile } from "../src/lib/checkoutContact";
it("accepts full name and formatted mobile without CPF", () => {
  expect(checkoutContactSchema.parse({ name: "  João   da Silva  ", phone: "(62) 99999-1234", email: "joao@example.com" })).toEqual({ name: "João da Silva", phone: "62999991234", email: "joao@example.com" });
});
it("formats pasted national and international mobile numbers", () => {
  expect(formatMobile("62999991234")).toBe("(62) 99999-1234");
  expect(formatMobile("+55 (62) 99999-1234")).toBe("(62) 99999-1234");
});
it("rejects missing surnames, incomplete mobiles and landlines", () => {
  for (const contact of [{ name: "João", phone: "62999991234" }, { name: "João Silva", phone: "629999" }, { name: "João Silva", phone: "6233334444" }]) {
    expect(checkoutContactSchema.safeParse({ ...contact, email: "joao@example.com" }).success).toBe(false);
  }
});

