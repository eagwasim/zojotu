import { db } from "../db";
import {
  serviceJobs,
  serviceJobParts,
  users,
  notifications,
  appSettings,
} from "../db/schema";
import { eq, desc, asc, and, sql, or } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";
import { decryptField, encryptField } from "../crypto/pii";
import { sendEmail } from "../email";
import {
  serviceAcceptedEmail,
  serviceRefusedEmail,
  serviceStatusUpdateEmail,
} from "../email/templates/service-status";
import { newServiceRequestAdminEmail } from "../email/templates/new-request";

function decryptJobResult(job: any) {
  if (!job) return job;
  return {
    ...job,
    customerName: decryptField(job.customerName) || job.customerName,
    customerEmail: decryptField(job.customerEmail) || job.customerEmail,
    customerPhone: decryptField(job.customerPhone) || job.customerPhone,
    shippingAddress: decryptField(job.shippingAddress) || job.shippingAddress,
  };
}

async function getCustomerEmail(userId: number): Promise<{ email: string; name: string } | null> {
  const [user] = await db
    .select({ email: users.email, name: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.email) return null;
  return {
    email: decryptField(user.email) || user.email,
    name: decryptField(user.name) || user.name,
  };
}

export async function getPaginatedServiceJobs(params: {
  page: number;
  pageSize: number;
  status?: string;
  customerId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, status, customerId, search, dateFrom, dateTo, sortBy, sortOrder = "desc" } = params;
  const conditions: any[] = [];

  if (status) conditions.push(eq(serviceJobs.status, status));
  if (customerId) conditions.push(eq(serviceJobs.customerId, customerId));
  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${serviceJobs.watchBrand}) LIKE ${term}`,
        sql`LOWER(${serviceJobs.watchModel}) LIKE ${term}`
      )
    );
  }
  if (dateFrom) {
    conditions.push(sql`${serviceJobs.createdAt} >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(sql`${serviceJobs.createdAt} <= ${dateTo + " 23:59:59"}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumns: Record<string, any> = {
    createdAt: serviceJobs.createdAt,
    status: serviceJobs.status,
    watchBrand: serviceJobs.watchBrand,
    estimatedCost: serviceJobs.estimatedCost,
    finalCost: serviceJobs.finalCost,
  };
  const sortCol = sortColumns[sortBy || "createdAt"] || serviceJobs.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(serviceJobs)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select({
      id: serviceJobs.id,
      customerId: serviceJobs.customerId,
      catalogItemId: serviceJobs.catalogItemId,
      watchBrand: serviceJobs.watchBrand,
      watchModel: serviceJobs.watchModel,
      watchSerial: serviceJobs.watchSerial,
      issueDescription: serviceJobs.issueDescription,
      status: serviceJobs.status,
      rejectionReason: serviceJobs.rejectionReason,
      estimatedCost: serviceJobs.estimatedCost,
      finalCost: serviceJobs.finalCost,
      shippingAddress: serviceJobs.shippingAddress,
      trackingNumber: serviceJobs.trackingNumber,
      trackingCarrier: serviceJobs.trackingCarrier,
      dateReceived: serviceJobs.dateReceived,
      dateDiagnosed: serviceJobs.dateDiagnosed,
      dateCompleted: serviceJobs.dateCompleted,
      dateCollected: serviceJobs.dateCollected,
      technicianNotes: serviceJobs.technicianNotes,
      warrantyPeriod: serviceJobs.warrantyPeriod,
      isPaid: serviceJobs.isPaid,
      createdAt: serviceJobs.createdAt,
      updatedAt: serviceJobs.updatedAt,
      customerName: users.displayName,
      customerEmail: users.email,
    })
    .from(serviceJobs)
    .leftJoin(users, eq(serviceJobs.customerId, users.id))
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(data.map(decryptJobResult), total, page, pageSize);
}

export async function getServiceJobById(id: number) {
  const [job] = await db
    .select({
      id: serviceJobs.id,
      customerId: serviceJobs.customerId,
      catalogItemId: serviceJobs.catalogItemId,
      watchBrand: serviceJobs.watchBrand,
      watchModel: serviceJobs.watchModel,
      watchSerial: serviceJobs.watchSerial,
      issueDescription: serviceJobs.issueDescription,
      status: serviceJobs.status,
      rejectionReason: serviceJobs.rejectionReason,
      estimatedCost: serviceJobs.estimatedCost,
      finalCost: serviceJobs.finalCost,
      shippingAddress: serviceJobs.shippingAddress,
      trackingNumber: serviceJobs.trackingNumber,
      trackingCarrier: serviceJobs.trackingCarrier,
      dateReceived: serviceJobs.dateReceived,
      dateDiagnosed: serviceJobs.dateDiagnosed,
      dateCompleted: serviceJobs.dateCompleted,
      dateCollected: serviceJobs.dateCollected,
      technicianNotes: serviceJobs.technicianNotes,
      warrantyPeriod: serviceJobs.warrantyPeriod,
      isPaid: serviceJobs.isPaid,
      createdAt: serviceJobs.createdAt,
      updatedAt: serviceJobs.updatedAt,
      customerName: users.displayName,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(serviceJobs)
    .leftJoin(users, eq(serviceJobs.customerId, users.id))
    .where(eq(serviceJobs.id, id))
    .limit(1);

  return decryptJobResult(job) || null;
}

export async function createServiceJob(data: {
  customerId: number;
  catalogItemId?: number;
  watchBrand: string;
  watchModel: string;
  watchSerial?: string;
  issueDescription: string;
}) {
  const [job] = await db
    .insert(serviceJobs)
    .values({ ...data, status: "Pending" })
    .returning();

  if (job) {
    const [emailSetting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "admin_notification_email"))
      .limit(1);
    const adminEmail = emailSetting?.value || process.env.ADMIN_NOTIFICATION_EMAIL;

    if (adminEmail) {
      const customer = await getCustomerEmail(job.customerId);
      const { html, text } = newServiceRequestAdminEmail(
        customer?.name || "Unknown",
        customer?.email || "N/A",
        job.watchBrand,
        job.watchModel,
        job.issueDescription
      );
      sendEmail({ to: adminEmail, subject: "New Service Request — Zojotu", html, text }).catch(() => {});
    }
  }

  return job;
}

export async function updateServiceJob(
  id: number,
  data: Partial<{
    status: string;
    rejectionReason: string;
    estimatedCost: number;
    finalCost: number;
    shippingAddress: string;
    trackingNumber: string;
    trackingCarrier: string;
    dateReceived: string;
    dateDiagnosed: string;
    dateCompleted: string;
    dateCollected: string;
    technicianNotes: string;
    warrantyPeriod: string;
    isPaid: number;
  }>
) {
  const [job] = await db
    .update(serviceJobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceJobs.id, id))
    .returning();
  return job;
}

export async function deleteServiceJob(id: number) {
  await db.delete(serviceJobs).where(eq(serviceJobs.id, id));
}

export async function acceptServiceJob(id: number) {
  const [addressSetting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "service_shipping_address"))
    .limit(1);

  const [instructionsSetting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "service_shipping_instructions"))
    .limit(1);

  const address = addressSetting?.value || "";
  const instructions = instructionsSetting?.value || "";
  const shippingAddressPlain = instructions
    ? `${address}\n\n${instructions}`
    : address;
  const shippingAddress = encryptField(shippingAddressPlain) || shippingAddressPlain;

  const [job] = await db
    .update(serviceJobs)
    .set({ status: "Accepted", shippingAddress, updatedAt: new Date() })
    .where(eq(serviceJobs.id, id))
    .returning();

  if (job) {
    await db.insert(notifications).values({
      userId: job.customerId,
      serviceJobId: id,
      type: "request_accepted",
      title: "Service Request Accepted",
      message: `Your service request for ${job.watchBrand} ${job.watchModel} has been accepted. Please ship your watch to the provided address.`,
    });

    const customer = await getCustomerEmail(job.customerId);
    if (customer) {
      const { html, text } = serviceAcceptedEmail(customer.name, job.watchBrand, job.watchModel, shippingAddressPlain);
      sendEmail({ to: customer.email, subject: "Service Request Accepted — Zojotu", html, text }).catch(() => {});
    }
  }

  return job;
}

export async function refuseServiceJob(id: number, reason: string) {
  const [job] = await db
    .update(serviceJobs)
    .set({ status: "Refused", rejectionReason: reason, updatedAt: new Date()})
    .where(eq(serviceJobs.id, id))
    .returning();

  if (job) {
    await db.insert(notifications).values({
      userId: job.customerId,
      serviceJobId: id,
      type: "request_refused",
      title: "Service Request Declined",
      message: `Your service request for ${job.watchBrand} ${job.watchModel} has been declined. Reason: ${reason}`,
    });

    const customer = await getCustomerEmail(job.customerId);
    if (customer) {
      const { html, text } = serviceRefusedEmail(customer.name, job.watchBrand, job.watchModel, reason);
      sendEmail({ to: customer.email, subject: "Service Request Declined — Zojotu", html, text }).catch(() => {});
    }
  }

  return job;
}

export async function updateServiceJobStatus(id: number, status: string) {
  const dateField: Record<string, string> = {
    Received: "dateReceived",
    Diagnosed: "dateDiagnosed",
    Completed: "dateCompleted",
    Collected: "dateCollected",
  };

  const updates: any = { status, updatedAt: new Date() };
  if (dateField[status]) {
    updates[dateField[status]] = new Date();
  }

  const [job] = await db
    .update(serviceJobs)
    .set(updates)
    .where(eq(serviceJobs.id, id))
    .returning();

  if (job) {
    await db.insert(notifications).values({
      userId: job.customerId,
      serviceJobId: id,
      type: "status_change",
      title: "Service Status Update",
      message: `Your ${job.watchBrand} ${job.watchModel} service status has been updated to: ${status}`,
    });

    const customer = await getCustomerEmail(job.customerId);
    if (customer) {
      const { html, text } = serviceStatusUpdateEmail(customer.name, job.watchBrand, job.watchModel, status);
      sendEmail({ to: customer.email, subject: `Service Update: ${status} — Zojotu`, html, text }).catch(() => {});
    }
  }

  return job;
}

export async function getServiceJobParts(jobId: number) {
  return db
    .select()
    .from(serviceJobParts)
    .where(eq(serviceJobParts.serviceJobId, jobId))
    .orderBy(desc(serviceJobParts.createdAt));
}

export async function addServiceJobPart(data: {
  serviceJobId: number;
  description: string;
  category: string;
  cost: number;
  quantity?: number;
  supplier?: string;
}) {
  const [part] = await db.insert(serviceJobParts).values(data).returning();
  return part;
}

export async function deleteServiceJobPart(partId: number) {
  await db.delete(serviceJobParts).where(eq(serviceJobParts.id, partId));
}
