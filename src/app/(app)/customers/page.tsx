"use client";

import { Suspense, useState } from "react";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/filter-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { usePaginatedFetch } from "@/hooks/use-paginated-fetch";
import { formatDate } from "@/lib/utils";
import { iconButtonClasses } from "@/components/ui/icon-button";

interface Customer {
  id: number;
  displayName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

function CustomersContent() {
  const {
    data: customers,
    total,
    page,
    totalPages,
    loading,
    setPage,
    setSearch,
    search,
  } = usePaginatedFetch<Customer>({ url: "/api/customers" });

  const [searchInput, setSearchInput] = useState(search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearch(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${total} customer${total !== 1 ? "s" : ""} registered`}
      />

      <SearchInput
        value={searchInput}
        onChange={handleSearchChange}
        placeholder="Search by name, email, or phone…"
        className="sm:max-w-sm"
      />

      {loading ? (
        <TableSkeleton cols={5} />
      ) : customers.length === 0 ? (
        <EmptyState
          title={search ? "No customers match your search" : "No customers yet"}
          description={
            search
              ? "Try a different name, email, or phone number."
              : "Customers appear here once they register through the customer portal."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-t border-border transition-colors hover:bg-accent/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {customer.displayName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/customers/${customer.id}`}
                          aria-label={`View ${customer.displayName}`}
                          title="View customer"
                          className={iconButtonClasses()}
                        >
                          <Eye className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={20}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<TableSkeleton cols={5} />}>
      <CustomersContent />
    </Suspense>
  );
}
