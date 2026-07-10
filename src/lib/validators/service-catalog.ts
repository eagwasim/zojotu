import { z } from "zod";

export const serviceCatalogSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  estimatedPrice: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  active: z.number().default(1),
});
