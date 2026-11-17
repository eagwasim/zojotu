"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Watch, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Watch className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-medium tracking-tight text-foreground">
            Reset password
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 aria-hidden className="h-10 w-10 text-good-ink" />
            <p className="text-center text-sm text-muted-foreground">
              If an account exists with that email, we've sent a password reset
              link. Check your inbox.
            </p>
            <a
              href="/login"
              className="mt-2 text-sm font-medium text-link hover:underline"
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />

            {error && (
              <p role="alert" className="text-sm text-critical-ink">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send reset link"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <a
                href="/login"
                className="font-medium text-link hover:underline"
              >
                Back to sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
