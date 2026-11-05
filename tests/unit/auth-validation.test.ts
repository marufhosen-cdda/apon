import { describe, expect, it } from "vitest";

import { authErrorKey } from "@/lib/auth-errors";
import {
  changePasswordSchema,
  isEmailIdentifier,
  isStrongPassword,
  isValidUsername,
  passwordChecks,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";

const valid = {
  email: "Sumaiya@Example.com",
  username: "sumaiya.r",
  password: "Circle2026safe",
  confirmPassword: "Circle2026safe",
};

describe("usernames", () => {
  it("accepts letters, numbers, dots and underscores", () => {
    for (const u of ["sumaiya", "sumaiya.r", "rafi_ahmed", "nusrat99", "a1b"]) expect(isValidUsername(u), u).toBe(true);
  });

  it("rejects bad formats, lengths and reserved names", () => {
    for (const u of ["ab", "a".repeat(31), ".start", "end.", "dou..ble", "under__", "has space", "emoji😀", "12345", "admin", "APON", "Support"]) {
      expect(isValidUsername(u), u).toBe(false);
    }
  });
});

describe("passwords", () => {
  it("requires length, a letter and a number", () => {
    expect(isStrongPassword("Circle2026safe")).toBe(true);
    expect(isStrongPassword("short1")).toBe(false);
    expect(isStrongPassword("onlyletters")).toBe(false);
    expect(isStrongPassword("1234567890")).toBe(false);
    expect(isStrongPassword(`a1${"x".repeat(127)}`)).toBe(false);
  });

  it("accepts Bangla letters", () => {
    expect(isStrongPassword("আপনবন্ধু২০২৬1")).toBe(true);
  });

  it("rejects passwords containing the username or email name", () => {
    expect(isStrongPassword("sumaiya2026!", ["sumaiya", "x@y.com"])).toBe(false);
    expect(isStrongPassword("Rafi12345", ["someone", "rafi@example.com"])).toBe(false);
    expect(passwordChecks("Circle2026safe", ["sumaiya"]).every((c) => c.ok)).toBe(true);
  });
});

describe("sign-up schema", () => {
  it("normalises the email and accepts a valid form", () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.email).toBe("sumaiya@example.com");
  });

  it("flags mismatched confirmation and personal passwords", () => {
    const mismatch = signUpSchema.safeParse({ ...valid, confirmPassword: "Other2026pass" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(["confirmPassword"]);

    const personal = signUpSchema.safeParse({ ...valid, password: "sumaiya.r2026", confirmPassword: "sumaiya.r2026" });
    expect(personal.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("sign-in, reset and change", () => {
  it("routes identifiers to email or username sign-in", () => {
    expect(isEmailIdentifier("a@b.com")).toBe(true);
    expect(isEmailIdentifier("sumaiya.r")).toBe(false);
    expect(signInSchema.safeParse({ identifier: " ", password: "x" }).success).toBe(false);
  });

  it("requires a 6-digit code and a strong new password to reset", () => {
    expect(resetPasswordSchema.safeParse({ email: "a@b.com", otp: "12345", password: "Circle2026safe", confirmPassword: "Circle2026safe" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ email: "a@b.com", otp: "123456", password: "Circle2026safe", confirmPassword: "Circle2026safe" }).success).toBe(true);
  });

  it("refuses reusing the current password", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "Circle2026safe", newPassword: "Circle2026safe", confirmPassword: "Circle2026safe" }).success).toBe(false);
  });
});

describe("auth error mapping", () => {
  it("keeps credential failures generic", () => {
    expect(authErrorKey({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("invalidCredentials");
    expect(authErrorKey({ code: "INVALID_USERNAME_OR_PASSWORD" })).toBe("invalidCredentials");
    expect(authErrorKey({ code: "USER_NOT_FOUND" })).toBe("invalidCredentials");
  });

  it("maps rate limits, codes and username conflicts", () => {
    expect(authErrorKey({ status: 429 })).toBe("rateLimited");
    expect(authErrorKey({ code: "OTP_EXPIRED" })).toBe("otpInvalid");
    expect(authErrorKey({ code: "USERNAME_IS_ALREADY_TAKEN" })).toBe("usernameTaken");
    expect(authErrorKey({ code: "WEAK_PASSWORD" })).toBe("passwordWeak");
    expect(authErrorKey(undefined)).toBe("generic");
  });
});
