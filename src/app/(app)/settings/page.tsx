"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your service platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">Notifications</h2>
          <div className="mt-3">
            <Input
              label="Admin Notification Email"
              value={settings.admin_notification_email}
              onChange={(e) => setSettings({ ...settings, admin_notification_email: e.target.value })}
              placeholder="admin@yourdomain.com"
              type="email"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Receive an email when a new service request is submitted.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-muted-foreground">Shipping</h2>
          <div className="mt-3 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Service Shipping Address
              </label>
              <textarea
                value={settings.service_shipping_address}
                onChange={(e) => setSettings({ ...settings, service_shipping_address: e.target.value })}
                rows={4}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Your workshop address where customers ship watches to..."
              />
              <p className="text-xs text-muted-foreground">
                Shown to customers when their service request is accepted.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Shipping Instructions
              </label>
              <textarea
                value={settings.service_shipping_instructions}
                onChange={(e) => setSettings({ ...settings, service_shipping_instructions: e.target.value })}
                rows={3}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Please insure the package, use tracked delivery, etc."
              />
              <p className="text-xs text-muted-foreground">
                Additional instructions shown alongside the shipping address.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
