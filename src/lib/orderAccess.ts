import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getSession } from "@/lib/auth";
const key = () => {
  if (!process.env.AUTH_SECRET?.trim()) throw new Error("ORDER_ACCESS_UNAVAILABLE");
  return new TextEncoder().encode(process.env.AUTH_SECRET);
};
const cookieName = (id: string) => `rifa_order_${id}`;
export async function grantOrderAccess(id: string) {
  const token = await new SignJWT({ purpose: "order-read" }).setSubject(id)
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
  (await cookies()).set(cookieName(id), token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
}
export async function canReadOrder(id: string) {
  if ((await getSession())?.role === "ADMIN") return true;
  const token = (await cookies()).get(cookieName(id))?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.sub === id && payload.purpose === "order-read";
  } catch { return false; }
}


