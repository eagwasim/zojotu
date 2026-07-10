import {
  pgTable,
  serial,
  text,
  real,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const watches = pgTable("watches", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  reference: text("reference"),
  movementType: text("movement_type").notNull(),
  acquisitionDate: text("acquisition_date").notNull(),
  source: text("source").notNull(),
  baseCost: real("base_cost").notNull(),
  status: text("status").notNull().default("In Inventory"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  cost: real("cost").notNull(),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  saleDate: text("sale_date").notNull(),
  platform: text("platform").notNull(),
  grossSalePrice: real("gross_sale_price").notNull(),
  platformFee: real("platform_fee").notNull().default(0),
  shippingInsurance: real("shipping_insurance").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchImages = pgTable("watch_images", {
  id: serial("id").primaryKey(),
  watchId: integer("watch_id")
    .notNull()
    .references(() => watches.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  stage: text("stage").notNull().default("before"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("user"),
  email: text("email"),
  emailHash: text("email_hash").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceCatalog = pgTable("service_catalog", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  estimatedPrice: real("estimated_price").notNull(),
  category: text("category").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceJobs = pgTable("service_jobs", {
  id: serial("id").primaryKey(),
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
  isPaid: integer("is_paid").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceJobParts = pgTable("service_job_parts", {
  id: serial("id").primaryKey(),
  serviceJobId: integer("service_job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  category: text("category").notNull(),
  cost: real("cost").notNull(),
  quantity: integer("quantity").notNull().default(1),
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceJobImages = pgTable("service_job_images", {
  id: serial("id").primaryKey(),
  serviceJobId: integer("service_job_id")
    .notNull()
    .references(() => serviceJobs.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  stage: text("stage").notNull().default("before"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
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
  createdAt: timestamp("created_at").defaultNow(),
});
