import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const watches = sqliteTable("watches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  reference: text("reference"),
  movementType: text("movement_type").notNull(),
  acquisitionDate: text("acquisition_date").notNull(),
  source: text("source").notNull(),
  baseCost: real("base_cost").notNull(),
  status: text("status").notNull().default("In Inventory"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const parts = sqliteTable("parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  cost: real("cost").notNull(),
  supplier: text("supplier"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  saleDate: text("sale_date").notNull(),
  platform: text("platform").notNull(),
  grossSalePrice: real("gross_sale_price").notNull(),
  platformFee: real("platform_fee").notNull().default(0),
  shippingInsurance: real("shipping_insurance").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const watchImages = sqliteTable("watch_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  stage: text("stage").notNull().default("before"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"),
  email: text("email"),
  emailHash: text("email_hash").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const serviceCatalog = sqliteTable("service_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  estimatedPrice: real("estimated_price").notNull(),
  category: text("category").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const serviceJobs = sqliteTable("service_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => users.id),
  catalogItemId: integer("catalog_item_id").references(() => serviceCatalog.id),
  watchBrand: text("watch_brand").notNull(),
  watchModel: text("watch_model").notNull(),
  watchSerial: text("watch_serial"),
  issueDescription: text("issue_description").notNull(),
  status: text("status").notNull().default("Pending"),
  rejectionReason: text("rejection_reason"),
  estimatedCost: real("estimated_cost"),
  finalCost: real("final_cost"),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  dateReceived: text("date_received"),
  dateDiagnosed: text("date_diagnosed"),
  dateCompleted: text("date_completed"),
  dateCollected: text("date_collected"),
  technicianNotes: text("technician_notes"),
  warrantyPeriod: text("warranty_period"),
  paymentInformation: text("payment_information"),
  isPaid: integer("is_paid").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const serviceJobParts = sqliteTable("service_job_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceJobId: integer("service_job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  category: text("category").notNull(),
  cost: real("cost").notNull(),
  quantity: integer("quantity").notNull().default(1),
  supplier: text("supplier"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const serviceJobImages = sqliteTable("service_job_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceJobId: integer("service_job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  stage: text("stage").notNull().default("before"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  serviceJobId: integer("service_job_id").references(() => serviceJobs.id, {
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
