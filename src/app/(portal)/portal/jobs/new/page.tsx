"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  estimatedPrice: number;
  category: string;
}

export default function NewServiceRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/service-catalog/public")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {});
  }, []);

  const selectedItem = catalog.find(
    (c) => c.id.toString() === selectedService
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const data = {
      catalogItemId: selectedService ? parseInt(selectedService) : undefined,
      watchBrand: fd.get("watchBrand") as string,
      watchModel: fd.get("watchModel") as string,
      watchSerial: (fd.get("watchSerial") as string) || undefined,
      issueDescription: fd.get("issueDescription") as string,
    };

    try {
      await apiPost("/api/service-jobs", data);
      toast("Service request submitted!", "success");
      router.push("/portal/jobs");
    } catch (e: any) {
      toast(e.message || "Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Request service"
        description="Submit a service request for your watch"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-foreground">
            Service type
          </h2>
          <div className="mt-3">
            <Select
              label="Choose a service (optional)"
              name="catalogItem"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              options={catalog.map((c) => ({
                value: c.id.toString(),
                label: `${c.name} — ${formatCurrency(c.estimatedPrice)}`,
              }))}
            />
            {selectedItem && selectedItem.description && (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedItem.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Don't see what you need? Describe your issue below and we'll
              provide a custom quote.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">
            Watch details
          </h2>
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Brand"
                name="watchBrand"
                placeholder="e.g. Omega"
                required
              />
              <Input
                label="Model"
                name="watchModel"
                placeholder="e.g. Speedmaster"
                required
              />
            </div>
            <Input
              label="Serial number (optional)"
              name="watchSerial"
              placeholder="If available"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground">
            Issue description
          </h2>
          <div className="mt-3">
            <Textarea
              label="Describe the issue or service needed"
              name="issueDescription"
              rows={4}
              required
              placeholder="Please describe what's wrong with your watch or what service you'd like performed…"
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
