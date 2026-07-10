import { z } from "zod";

export const serviceJobCreateSchema = z.object({
  catalogItemId: z.number().optional(),
  watchBrand: z.string().min(1, "Watch brand is required"),
  watchModel: z.string().min(1, "Watch model is required"),
  watchSerial: z.string().optional(),
  issueDescription: z.string().min(1, "Issue description is required"),
});

export const serviceJobUpdateSchema = z.object({
  status: z
    .enum([
      "Pending",
      "Accepted",
      "Refused",
      "Shipped",
      "Received",
      "Diagnosed",
      "In Progress",
      "Completed",
      "Collected",
    ])
    .optional(),
  rejectionReason: z.string().optional(),
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
  technicianNotes: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  isPaid: z.number().optional(),
});
