"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface Settings {
  admin_notification_email: string;
  service_shipping_address: string;
  service_shipping_instructions: string;
}

const DEFAULTS: Settings = {
  admin_notification_email: "",
  service_shipping_address: "",
  service_shipping_instructions: "",
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast("Settings saved", "success");
    } catch (e: any) {
      toast(e.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-label="Loading" className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Configure your service platform" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">Notifications</h2>
          <div className="mt-3">
            <Input
              label="Admin notification email"
              value={settings.admin_notification_email}
              onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
              placeholder="admin@yourdomain.com"
              type="email"
              hint="Receive an email when a new service request is submitted."
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">Shipping</h2>
          <div className="mt-3 space-y-4">
            <Textarea
              label="Service shipping address"
              value={settings.service_shipping_address}
              onChange={(e) => setSettings({ ...settings, service_shipping_address: e.target.value })}
              rows={4}
              placeholder="Your workshop address where customers ship watches to..."
              hint="Shown to customers when their service request is accepted."
            />
            <Textarea
              label="Shipping instructions"
              value={settings.service_shipping_instructions}
              onChange={(e) => setSettings({ ...settings, service_shipping_instructions: e.target.value })}
              rows={3}
              placeholder="e.g. Please insure the package, use tracked delivery, etc."
              hint="Additional instructions shown alongside the shipping address."
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
