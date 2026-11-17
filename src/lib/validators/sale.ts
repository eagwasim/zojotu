import { z } from "zod";

const saleFields = {
  watchId: z.number().int().positive("Choose the watch you sold"),
  saleDate: z.string().min(1, "Sale date is required"),
  platform: z.string().trim().min(1, "Where did it sell?"),
  grossSalePrice: z.number({ error: "Enter the sale price" }).positive("Sale price must be more than 0"),
  platformFee: z.number().min(0, "Fee can't be negative"),
  shippingInsurance: z.number().min(0, "Shipping can't be negative"),
  notes: z.string().optional(),
};

export const saleSchema = z.object({
  ...saleFields,
  platformFee: saleFields.platformFee.default(0),
  shippingInsurance: saleFields.shippingInsurance.default(0),
});

/**
 * PUT /api/sales/[id]. Built without defaults on purpose: `.partial()` keeps
 * `.default(0)`, which would silently zero the fee on any partial update.
 */
export const saleUpdateSchema = z.object(saleFields).partial();

export type SaleInput = z.infer<typeof saleSchema>;
