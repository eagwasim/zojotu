import { z } from "zod";

export const saleSchema = z.object({
  watchId: z.number().int().positive("Watch is required"),
  saleDate: z.string().min(1, "Sale date is required"),
  platform: z.string().min(1, "Platform is required"),
  grossSalePrice: z.number().positive("Sale price must be positive"),
  platformFee: z.number().min(0).default(0),
  shippingInsurance: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;
