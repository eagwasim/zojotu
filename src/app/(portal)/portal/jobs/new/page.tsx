"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Request Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a service request for your watch
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">
            Service Type
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
          <h2 className="text-sm font-medium text-muted-foreground">
            Watch Details
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
              label="Serial Number (optional)"
              name="watchSerial"
              placeholder="If available"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">
            Issue Description
          </h2>
          <div className="mt-3">
            <label className="block text-sm font-medium text-foreground">
              Describe the issue or service needed
            </label>
            <textarea
              name="issueDescription"
              rows={4}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Please describe what's wrong with your watch or what service you'd like performed..."
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
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
