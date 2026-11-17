"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="mx-auto max-w-xl space-y-6" role="status" aria-label="Loading">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="My profile" description="Update your contact information" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
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
          <Textarea
            label="Address"
            name="address"
            defaultValue={profile.address || ""}
            rows={3}
            placeholder="Your shipping address…"
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
