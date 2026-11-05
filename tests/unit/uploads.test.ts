import { describe, expect, it } from "vitest";

import { signParams } from "@/lib/uploads/signature";
import {
  UPLOAD_POLICIES,
  acceptFor,
  checkUpload,
  cleanFileName,
  formatBytes,
  isUploadPurpose,
  sniffFileKind,
} from "@/lib/uploads/policy";

const bytes = (...b: number[]) => new Uint8Array(b);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50);
const PDF = new TextEncoder().encode("%PDF-1.7\n");
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">');
const HTML = new TextEncoder().encode("<!doctype html><script>");
const GIF = new TextEncoder().encode("GIF89a");

describe("Cloudinary signing", () => {
  it("matches Cloudinary's documented example", () => {
    // https://cloudinary.com/documentation/authentication_signatures
    expect(
      signParams(
        { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 },
        "abcd",
      ),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });

  it("ignores unsigned and empty parameters, and parameter order", () => {
    const a = signParams({ timestamp: 1, folder: "apon/avatars", api_key: "k", file: "x", resource_type: "image", empty: "" }, "s");
    const b = signParams({ folder: "apon/avatars", timestamp: 1 }, "s");
    expect(a).toBe(b);
    expect(signParams({ folder: "apon/avatars", timestamp: 1 }, "other")).not.toBe(b);
  });
});

describe("file type sniffing", () => {
  it("recognises allowed formats by content", () => {
    expect(sniffFileKind(JPEG)).toBe("jpeg");
    expect(sniffFileKind(PNG)).toBe("png");
    expect(sniffFileKind(WEBP)).toBe("webp");
    expect(sniffFileKind(PDF)).toBe("pdf");
  });

  it("rejects active or unsupported content regardless of name", () => {
    for (const head of [SVG, HTML, GIF, bytes(), bytes(0xff, 0xd8)]) expect(sniffFileKind(head)).toBeNull();
  });
});

describe("upload policy", () => {
  it("enforces type per purpose", () => {
    expect(checkUpload("avatar", 1000, PNG)).toEqual({ ok: true, kind: "png" });
    expect(checkUpload("avatar", 1000, PDF)).toEqual({ ok: false, error: "uploads.errors.type" });
    expect(checkUpload("report_evidence", 1000, PDF)).toEqual({ ok: true, kind: "pdf" });
    expect(checkUpload("host_document", 1000, SVG)).toEqual({ ok: false, error: "uploads.errors.type" });
  });

  it("enforces size limits", () => {
    expect(checkUpload("avatar", 0, PNG)).toEqual({ ok: false, error: "uploads.errors.empty" });
    expect(checkUpload("avatar", UPLOAD_POLICIES.avatar.maxBytes + 1, PNG)).toEqual({ ok: false, error: "uploads.errors.tooLarge" });
    expect(checkUpload("report_evidence", 8 * 1024 * 1024, PDF).ok).toBe(true);
  });

  it("keeps sensitive purposes private and images public", () => {
    expect(UPLOAD_POLICIES.report_evidence.access).toBe("private");
    expect(UPLOAD_POLICIES.host_document.access).toBe("private");
    expect(UPLOAD_POLICIES.avatar.access).toBe("public");
    expect(UPLOAD_POLICIES.activity_cover.role).toBe("host");
    expect(UPLOAD_POLICIES.venue_photo.role).toBe("admin");
  });

  it("builds accept lists and validates purposes", () => {
    expect(acceptFor("avatar")).toBe("image/jpeg,image/png,image/webp");
    expect(acceptFor("host_document")).toContain("application/pdf");
    expect(isUploadPurpose("avatar")).toBe(true);
    expect(isUploadPurpose("../etc")).toBe(false);
  });

  it("cleans file names and formats sizes", () => {
    expect(cleanFileName("Résumé (final).PDF", "pdf")).toBe("Resume-final.pdf");
    expect(cleanFileName("../../evil<script>.png", "png")).toBe("evilscript.png");
    expect(cleanFileName("", "jpeg")).toBe("file.jpg");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(2048)).toBe("2 KB");
  });
});
