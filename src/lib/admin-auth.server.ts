import { createHmac, timingSafeEqual } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";

const WEEK = 7 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

export function adminConfigured() {
  return secret().length > 0;
}

export function passwordsMatch(given: string) {
  const expected = secret();
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function adminCookie(now = Date.now()) {
  const key = secret();
  const exp = String(now + WEEK);
  const sig = createHmac("sha256", key).update(exp).digest("hex");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `pma_admin=${exp}.${sig}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${secure}`;
}

export function adminSessionOk(cookieHeader: string | null, now = Date.now()) {
  const key = secret();
  if (!key) return false;
  const match = /(?:^|; )pma_admin=([0-9]+\.[a-f0-9]+)/.exec(cookieHeader ?? "");
  if (!match) return false;
  const [exp, sig] = match[1].split(".");
  if (!exp || !sig || Number(exp) < now) return false;
  const expected = createHmac("sha256", key).update(exp).digest("hex");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function clearAdminCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `pma_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

export function requestIsAdmin() {
  const request = getRequest();
  return adminSessionOk(request?.headers.get("cookie") ?? null);
}
