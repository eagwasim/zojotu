import { z } from "zod";

export const MOVEMENTS = [
  "Automatic",
  "Quartz",
  "Manual",
  "Solar",
  "Mecha-Quartz",
  "Vintage Manual",
] as const;

export const WATCH_STATUSES = ["In Inventory", "Modding", "Listed", "Sold"] as const;

/** Statuses you can set directly. "Sold" only comes from recording a sale. */
export const SETTABLE_STATUSES = ["In Inventory", "Modding", "Listed"] as const;

export const CONDITIONS = ["New", "Excellent", "Very good", "Good", "Fair", "For parts"] as const;

const optionalText = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null));

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

export const watchSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  reference: optionalText,
  movementType: z.enum(MOVEMENTS, { error: "Choose a movement" }),
  acquisitionDate: isoDate,
  source: z.string().trim().min(1, "Where did you buy it?"),
  baseCost: z.number({ error: "Enter what you paid" }).min(0, "Cost must be 0 or more"),
  status: z.enum(WATCH_STATUSES),
  notes: optionalText,
  askingPrice: z.number().min(0, "Price must be 0 or more").nullish(),
  listedDate: isoDate.nullish(),
  listedPlatform: optionalText,
  serial: optionalText,
  condition: z.enum(CONDITIONS).nullish(),
  primaryImageId: z.number().int().positive().nullish(),
});

/** PUT /api/watches/[id]: any subset of fields, same rules. Unknown keys are dropped. */
export const watchUpdateSchema = watchSchema.partial();

export const bulkStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500),
  status: z.enum(SETTABLE_STATUSES),
});

export type WatchInput = z.infer<typeof watchSchema>;
export type WatchUpdate = z.infer<typeof watchUpdateSchema>;
