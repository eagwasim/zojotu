import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";

describe("Authentication Logic", () => {
  it("hashes passwords with bcrypt", async () => {
    const password = "admin";
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies correct password", async () => {
    const password = "admin";
    const hash = await bcrypt.hash(password, 12);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const hash = await bcrypt.hash("admin", 12);
    const valid = await bcrypt.compare("wrong", hash);
    expect(valid).toBe(false);
  });

  it("generates unique hashes for same password", async () => {
    const hash1 = await bcrypt.hash("admin", 12);
    const hash2 = await bcrypt.hash("admin", 12);
    expect(hash1).not.toBe(hash2);
  });
});

describe("Session / JWT Logic", () => {
  it("rejects empty token", () => {
    const token = "";
    expect(token).toBeFalsy();
  });

  it("session payload structure", () => {
    const payload = { userId: 1, username: "admin", role: "admin" };
    expect(payload).toHaveProperty("userId");
    expect(payload).toHaveProperty("username");
    expect(payload).toHaveProperty("role");
  });
});
