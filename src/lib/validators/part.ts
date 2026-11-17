import { z } from "zod";

export const PART_CATEGORIES = [
  "Hardware",
  "Strap",
  "Movement",
  "Glass",
  "Dial",
  "Bezel",
  "Case",
  "Other",
] as const;

export const partSchema = z.object({
  watchId: z.number().int().positive("Watch is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().trim().min(1, "What was it?"),
  category: z.enum(PART_CATEGORIES, { error: "Choose a category" }),
  cost: z.number().min(0, "Cost must be 0 or more"),
  supplier: z.string().optional(),
});

export type PartInput = z.infer<typeof partSchema>;
