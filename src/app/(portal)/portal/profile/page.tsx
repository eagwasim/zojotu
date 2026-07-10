"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { apiPut } from "@/lib/api-client";

interface Profile {
  id: number;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: fd.get("displayName"),
          phone: fd.get("phone") || null,
          address: fd.get("address") || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      toast("Profile updated", "success");
    } catch (e: any) {
      toast(e.message || "Failed to update", "error");
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

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your contact information
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="displayName"
            defaultValue={profile.displayName}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={profile.email || ""}
            disabled
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone || ""}
            placeholder="+31 6 1234 5678"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Address
            </label>
            <textarea
              name="address"
              defaultValue={profile.address || ""}
              rows={3}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Your shipping address..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
