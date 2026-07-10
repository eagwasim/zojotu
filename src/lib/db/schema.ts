import * as pgSchema from "./schema-pg";
import * as sqliteSchema from "./schema-sqlite";

const driver = process.env.DB_DRIVER || "postgres";

const schema = driver === "sqlite" ? sqliteSchema : pgSchema;

export const watches = schema.watches;
export const parts = schema.parts;
export const sales = schema.sales;
export const expenses = schema.expenses;
export const watchImages = schema.watchImages;
export const appSettings = schema.appSettings;
export const users = schema.users;
export const passwordResetTokens = schema.passwordResetTokens;
export const serviceCatalog = schema.serviceCatalog;
export const serviceJobs = schema.serviceJobs;
export const serviceJobParts = schema.serviceJobParts;
export const serviceJobImages = schema.serviceJobImages;
export const notifications = schema.notifications;
