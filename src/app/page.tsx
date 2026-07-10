"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Watch, ArrowRight, CheckCircle2, Heart, MessageSquare } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
  estimatedPrice: number;
  category: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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
            <Watch className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Van Christaan</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[300px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute left-0 top-1/2 h-[200px] w-[300px] -translate-x-1/3 rounded-full bg-blue-500/5 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/5"
          >
            <Watch className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Affordable Watch Servicing
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            I'm a hobbyist watchmaker based in the Netherlands, helping people maintain watches that might be too expensive to service through official channels. No fancy workshop - just careful hands, cheap rates, and a genuine love for horology.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Request a Service
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              How It Works
            </a>
          </div>
        </motion.div>
      </section>

      {/* Honest pitch */}
      <section className="border-t border-border py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-foreground">What to expect</h2>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>This is a <strong className="text-foreground">hobby project</strong>. I'm self-taught and still learning. I'll always be upfront about what I can and can't do.</p>
              </div>
              <div className="flex gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p><strong className="text-foreground">Communication first.</strong> I'll diagnose your watch and give you an honest assessment before any work begins. No surprises.</p>
              </div>
              <div className="flex gap-3">
                <Watch className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p><strong className="text-foreground">Cheap rates.</strong> I charge for parts and a small service fee - way less than official service centers. This isn't a business trying to maximize profit, it's a passion that helps people keep their watches running.</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">A note on risk:</strong> I don't carry insurance on pieces in my care. I handle every watch with extreme caution, but if this concerns you, a professional service center may be a better fit. I'm happy to recommend one.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground">How it works</h2>
            <div className="mt-8 space-y-6">
              {[
                { n: "1", title: "Submit a request", desc: "Create an account, tell me about your watch and what's wrong." },
                { n: "2", title: "I'll review it", desc: "I'll let you know if it's something I can help with. If not, I'll say so." },
                { n: "3", title: "Ship your watch", desc: "If accepted, send it to me via tracked delivery. I'll confirm when it arrives." },
                { n: "4", title: "Diagnosis & quote", desc: "I'll take a look, tell you what I find, and give you a price before doing any work." },
                { n: "5", title: "Service & return", desc: "Once you approve, I'll do the work and ship it back to you." },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section id="services" className="border-t border-border py-20 px-6">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground">What I can help with</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prices are estimates - I'll always confirm the exact cost after diagnosis.
              </p>
              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="mt-6 space-y-3"
              >
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    variants={item}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ~{formatCurrency(service.estimatedPrice)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
              <p className="mt-4 text-xs text-muted-foreground">
                Have something else in mind? Just describe it when you submit a request.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 py-20 px-6">
        <div className="mx-auto max-w-xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground">Got a watch that needs attention?</h2>
            <p className="mt-3 text-muted-foreground">
              Create a free account and submit a request. No obligations - I'll tell you honestly if I can help.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Van Christaan</span>
          </div>
          <p className="text-xs text-muted-foreground">
            A hobby watchmaker based in the Netherlands, helping people keep their watches running.
          </p>
        </div>
      </footer>
    </div>
  );
}
