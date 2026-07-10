import { z } from "zod";

export const partSchema = z.object({
  watchId: z.number().int().positive("Watch is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "Hardware",
    "Strap",
    "Movement",
    "Glass",
    "Dial",
    "Bezel",
    "Case",
    "Other",
  ]),
  cost: z.number().min(0, "Cost must be 0 or more"),
  supplier: z.string().optional(),
});

export type PartInput = z.infer<typeof partSchema>;
