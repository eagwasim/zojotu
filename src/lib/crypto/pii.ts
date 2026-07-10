import crypto from "crypto";
import { encrypt, decrypt } from "./index";

// All PII fields are encrypted at rest.
// Email uses a SHA-256 hash (emailHash) for login lookups.
const PII_FIELDS: Record<string, string[]> = {
  users: ["displayName", "email", "phone", "address"],
  serviceJobs: ["shippingAddress"],
  notifications: ["message"],
};

export function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

export function encryptPII<T extends Record<string, any>>(
  entity: string,
  data: T
): T {
  const fields = PII_FIELDS[entity];
  if (!fields) return data;

  const result = { ...data };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      (result as any)[field] = encrypt(result[field]);
    }
  }
  return result;
}

export function decryptPII<T extends Record<string, any>>(
  entity: string,
  data: T | null
): T | null {
  if (!data) return null;
  const fields = PII_FIELDS[entity];
  if (!fields) return data;

  const result = { ...data };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      try {
        (result as any)[field] = decrypt(result[field]);
      } catch {
        // Field may not be encrypted (legacy data)
      }
    }
  }
  return result;
}

export function decryptPIIList<T extends Record<string, any>>(
  entity: string,
  data: T[]
): T[] {
  return data.map((item) => decryptPII(entity, item)!);
}

export function encryptField(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  return encrypt(value);
}

export function decryptField(value: string | null | undefined): string | null | undefined {
  if (!value) return value;
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}
