"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Watch, ArrowRight, CheckCircle2, Heart, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  estimatedPrice: number;
  category: string;
}

export default function LandingPage() {
  const [services, setServices] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetch("/api/service-catalog/public")
      .then((r) => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Watch className="h-6 w-6 text-foreground" />
            <span className="text-xl font-bold text-foreground">Zojotu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={buttonClasses({ variant: "ghost" })}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={buttonClasses()}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 pt-16">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <Watch className="h-8 w-8 text-foreground" />
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Affordable watch servicing
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            I'm a hobbyist watchmaker based in the Netherlands, helping people maintain watches that might be too expensive to service through official channels. No fancy workshop - just careful hands, cheap rates, and a genuine love for horology.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className={buttonClasses({ size: "lg" })}
            >
              Request a service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Honest pitch */}
      <section className="border-t border-border py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">What to expect</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>This is a <strong className="text-foreground">hobby project</strong>. I'm self-taught and still learning. I'll always be upfront about what I can and can't do.</p>
              </div>
              <div className="flex gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p><strong className="text-foreground">Communication first.</strong> I'll diagnose your watch and give you an honest assessment before any work begins. No surprises.</p>
              </div>
              <div className="flex gap-3">
                <Watch className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p><strong className="text-foreground">Cheap rates.</strong> I charge for parts and a small service fee - way less than official service centers. This isn't a business trying to maximize profit, it's a passion that helps people keep their watches running.</p>
              </div>
            </div>
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">A note on risk:</strong> I don't carry insurance on pieces in my care. I handle every watch with extreme caution, but if this concerns you, a professional service center may be a better fit. I'm happy to recommend one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
            <div className="mt-8 space-y-6">
              {[
                { n: "1", title: "Submit a request", desc: "Create an account, tell me about your watch and what's wrong." },
                { n: "2", title: "I'll review it", desc: "I'll let you know if it's something I can help with. If not, I'll say so." },
                { n: "3", title: "Ship your watch", desc: "If accepted, send it to me via tracked delivery. I'll confirm when it arrives." },
                { n: "4", title: "Diagnosis & quote", desc: "I'll take a look, tell you what I find, and give you a price before doing any work." },
                { n: "5", title: "Service & return", desc: "Once you approve, I'll do the work and ship it back to you." },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-primary-foreground">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section id="services" className="border-t border-border py-20 px-6">
          <div className="mx-auto max-w-2xl">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">What I can help with</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prices are estimates - I'll always confirm the exact cost after diagnosis.
              </p>
              <div className="mt-6 space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-lg bg-card px-4 py-3 shadow-card"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 aria-hidden className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      ~{formatCurrency(service.estimatedPrice)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Have something else in mind? Just describe it when you submit a request.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-xl text-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Got a watch that needs attention?</h2>
            <p className="mt-3 text-muted-foreground">
              Create a free account and submit a request. No obligations - I'll tell you honestly if I can help.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className={buttonClasses({ size: "lg" })}
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-link hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-foreground">Zojotu</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A hobby watchmaker based in the Netherlands, helping people keep their watches running.
          </p>
        </div>
      </footer>
    </div>
  );
}
