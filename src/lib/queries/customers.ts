import { db } from "../db";
import { users, serviceJobs } from "../db/schema";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { paginatedResult, type PaginatedResult } from "./pagination";
import { decryptPII, decryptPIIList } from "../crypto/pii";

export async function getPaginatedCustomers(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<PaginatedResult<any>> {
  const { page, pageSize, search } = params;
  const conditions: any[] = [eq(users.role, "customer")];

  if (search) {
    const term = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${users.displayName}) LIKE ${term}`,
        sql`LOWER(${users.email}) LIKE ${term}`,
        sql`LOWER(${users.phone}) LIKE ${term}`
      )
    );
  }

  const where = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(where);

  const total = Number(countResult.count);

  const data = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      phone: users.phone,
      address: users.address,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return paginatedResult(decryptPIIList("users", data), total, page, pageSize);
}

export async function getCustomerById(id: number) {
  const [customer] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      phone: users.phone,
      address: users.address,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "customer")))
    .limit(1);

  return decryptPII("users", customer);
}

export async function getCustomerStats(customerId: number) {
  const jobs = await db
    .select()
    .from(serviceJobs)
    .where(eq(serviceJobs.customerId, customerId))
    .orderBy(desc(serviceJobs.createdAt));

  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(
    (j: any) => j.status === "Completed" || j.status === "Collected"
  ).length;
  const activeJobs = jobs.filter(
    (j: any) => !["Completed", "Collected", "Refused"].includes(j.status)
  ).length;
  const totalRevenue = jobs.reduce(
    (sum: number, j: any) => sum + (j.finalCost || 0),
    0
  );
  const lastServiceDate = jobs.length > 0 ? jobs[0].createdAt : null;

  return { totalJobs, completedJobs, activeJobs, totalRevenue, lastServiceDate, jobs };
}
