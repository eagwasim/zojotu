import { z } from "zod";

export const watchSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  reference: z.string().optional(),
  movementType: z.enum([
    "Automatic",
    "Quartz",
    "Manual",
    "Solar",
    "Mecha-Quartz",
    "Vintage Manual",
  ]),
  acquisitionDate: z.string().min(1, "Acquisition date is required"),
  source: z.string().min(1, "Source is required"),
  baseCost: z.number().min(0, "Cost must be 0 or more"),
  status: z.enum(["In Inventory", "Modding", "Listed", "Sold"]),
  notes: z.string().optional(),
});

export type WatchInput = z.infer<typeof watchSchema>;
