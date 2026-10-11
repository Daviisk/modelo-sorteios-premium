import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secret = () => {
  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error("Login indisponível: configure AUTH_SECRET no ambiente do servidor e reinicie a aplicação.");
  }
  return new TextEncoder().encode(process.env.AUTH_SECRET);
};
const COOKIE_NAME = "rifa_admin_session";
const MAX_AGE = Number(process.env.AUTH_SESSION_MAX_AGE ?? 604800);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") throw new Error("Credenciais inválidas.");
  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error("Credenciais inválidas.");

  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role, credentialVersion: crypto.createHash("sha256").update(user.password).digest("hex") })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(secret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return user;
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
}

/** Usado em Server Components/Route Handlers para checar a sessão do admin. */
export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.role !== "ADMIN" || payload.credentialVersion !== crypto.createHash("sha256").update(user.password).digest("hex")) return null;
    return payload as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

/** Lança se não houver sessão de admin válida — usar no topo de rotas protegidas. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

