import { z } from "zod";

export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 13 && digits.startsWith("55") ? digits.slice(2) : digits;
}

export function formatMobile(value: string): string {
  const digits = normalizeMobile(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2);
  return `(${digits.slice(0, 2)}) ${local.slice(0, 5)}${local.length > 5 ? `-${local.slice(5)}` : ""}`;
}

export const checkoutContactSchema = z.object({
  name: z.string().max(150, "Nome muito longo.").trim().transform(value => value.replace(/\s+/g, " ")).refine(
    value => value.split(" ").length >= 2 && value.split(" ").every(part => /^[\p{L}][\p{L}'’-]*$/u.test(part)),
    "Informe seu nome completo, com nome e sobrenome.",
  ),
  phone: z.string().max(32).transform(normalizeMobile).pipe(z.string().regex(/^[1-9][0-9]9[0-9]{8}$/, "Informe um celular com DDD: (11) 99999-9999.")),
  email: z.string().max(254).trim().email("Informe um e-mail válido.").optional().or(z.literal("")).transform(value => value || undefined),
});

