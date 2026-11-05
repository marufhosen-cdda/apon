import { z } from "zod";

/**
 * Credential rules shared by the auth forms (client) and the Better Auth
 * hooks (server), so both sides always agree. Client-safe: no server imports.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Names that could be mistaken for staff or system accounts. */
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "apon", "aponapp", "root", "support", "help", "staff",
  "moderator", "mod", "system", "official", "team", "security", "null", "undefined",
  "api", "www", "mail", "settings", "signin", "signup", "login", "logout",
]);

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9._]*[a-zA-Z0-9])?$/;

/** True when a username is allowed (format, length, not reserved, no "..", not all digits). */
export function isValidUsername(raw: string): boolean {
  const value = raw.trim();
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) return false;
  if (!USERNAME_PATTERN.test(value)) return false;
  if (/[._]{2}/.test(value)) return false;
  if (/^\d+$/.test(value)) return false;
  return !RESERVED_USERNAMES.has(value.toLowerCase());
}

export const usernameSchema = z
  .string()
  .trim()
  .refine(isValidUsername, { message: "auth.errors.usernameInvalid" });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email({ message: "auth.errors.emailInvalid" });

export interface PasswordCheck {
  key: "length" | "letter" | "number" | "notPersonal";
  ok: boolean;
}

/** Individual password requirements, for the live checklist and the server hook. */
export function passwordChecks(password: string, personal: string[] = []): PasswordCheck[] {
  const lower = password.toLowerCase();
  const personalHit = personal
    .map((p) => p.trim().toLowerCase().split("@")[0])
    .filter((p) => p.length >= 3)
    .some((p) => lower.includes(p));
  return [
    { key: "length", ok: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX },
    { key: "letter", ok: /\p{L}/u.test(password) },
    { key: "number", ok: /\d/.test(password) },
    { key: "notPersonal", ok: !personalHit },
  ];
}

export function isStrongPassword(password: string, personal: string[] = []): boolean {
  return passwordChecks(password, personal).every((c) => c.ok);
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, { message: "auth.errors.passwordWeak" })
  .max(PASSWORD_MAX, { message: "auth.errors.passwordWeak" })
  .refine((p) => isStrongPassword(p), { message: "auth.errors.passwordWeak" });

export const signUpSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.errors.passwordMismatch",
  })
  .refine((v) => isStrongPassword(v.password, [v.username, v.email]), {
    path: ["password"],
    message: "auth.errors.passwordPersonal",
  });

/** Sign-in accepts an email address or a username in one field. */
export const signInSchema = z.object({
  identifier: z.string().trim().min(1, { message: "auth.errors.identifierRequired" }).max(254),
  password: z.string().min(1, { message: "auth.errors.passwordRequired" }).max(PASSWORD_MAX),
});

export const isEmailIdentifier = (identifier: string) => identifier.includes("@");

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "auth.errors.codeInvalid" });

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.errors.passwordMismatch",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "auth.errors.passwordRequired" }),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "auth.errors.passwordMismatch",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "auth.errors.passwordSame",
  });
