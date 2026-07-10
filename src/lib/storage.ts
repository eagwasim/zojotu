import { db } from "./db";
import { appSettings } from "./db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

export type StorageProvider = "local" | "google-drive";

interface StorageConfig {
  provider: StorageProvider;
  localPath: string;
  googleDriveFolderId?: string;
}

export async function getStorageConfig(): Promise<StorageConfig> {
  const [providerRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "storage_provider"));

  const [localPathRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "storage_local_path"));

  const [gdriveRow] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "storage_gdrive_folder"));

  return {
    provider: (providerRow?.value as StorageProvider) || "local",
    localPath: localPathRow?.value || path.join(process.cwd(), "data", "images"),
    googleDriveFolderId: gdriveRow?.value,
  };
}

export async function updateStorageConfig(config: Partial<StorageConfig>) {
  if (config.provider) {
    await db
      .insert(appSettings)
      .values({ key: "storage_provider", value: config.provider })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: config.provider },
      });
  }
  if (config.localPath) {
    await db
      .insert(appSettings)
      .values({ key: "storage_local_path", value: config.localPath })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: config.localPath },
      });
  }
  if (config.googleDriveFolderId) {
    await db
      .insert(appSettings)
      .values({ key: "storage_gdrive_folder", value: config.googleDriveFolderId })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: config.googleDriveFolderId },
      });
  }
}

export async function saveImageLocally(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const config = await getStorageConfig();
  const dir = config.localPath;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

export async function getImagePath(filename: string): Promise<string> {
  const config = await getStorageConfig();
  return path.join(config.localPath, filename);
}

export async function deleteImage(filename: string): Promise<void> {
  const config = await getStorageConfig();
  const filePath = path.join(config.localPath, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
