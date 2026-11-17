"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MessageSquare, ShieldAlert, Wallet } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandMark, Container, drawnUnderline } from "@/components/site/brand";
import { Reveal } from "@/components/site/reveal";
import { photos, PHOTO_CREDIT } from "@/components/site/photos";
import styles from "@/components/site/site.module.css";
import { cn, formatCurrency } from "@/lib/utils";

interface CatalogItem {
  id: number;
  name: string;
  description?: string | null;
  estimatedPrice: number;
  category: string;
}

const STEPS = [
  { title: "Submit a request", desc: "Create an account, tell me about your watch and what's wrong." },
  { title: "I'll review it", desc: "I'll let you know if it's something I can help with. If not, I'll say so." },
  { title: "Ship your watch", desc: "If accepted, send it to me via tracked delivery. I'll confirm when it arrives." },
  { title: "Diagnosis & quote", desc: "I'll take a look, tell you what I find, and give you a price before doing any work." },
  { title: "Service & return", desc: "Once you approve, I'll do the work and ship it back to you." },
];

const EXPECT = [
  {
    icon: Heart,
    title: "A hobby project",
    body: "I'm self-taught and still learning. I'll always be upfront about what I can and can't do.",
  },
  {
    icon: MessageSquare,
    title: "Communication first",
    body: "I'll diagnose your watch and give you an honest assessment before any work begins. No surprises.",
  },
  {
    icon: Wallet,
    title: "Cheap rates",
    body: "I charge for parts and a small service fee, way less than official service centres. This isn't a business trying to maximise profit; it's a passion that helps people keep their watches running.",
  },
];

export function LandingPage() {
  const [services, setServices] = useState<CatalogItem[] | null>(null);

  useEffect(() => {
    fetch("/api/service-catalog/public")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => setServices([]));
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <BrandMark />
          <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
            <a href="#how-it-works" className={cn("hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:inline", drawnUnderline)}>
              How it works
            </a>
            <a href="#services" className={cn("hidden px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:inline", drawnUnderline)}>
              Services
            </a>
            <Link href="/login" className={buttonClasses({ variant: "ghost", className: "min-h-11 sm:min-h-9" })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClasses({ className: "hidden min-h-11 sm:inline-flex sm:min-h-9" })}>
              Request a service
            </Link>
          </nav>
        </Container>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="py-12 sm:py-20 lg:py-24">
          <Container className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div className={cn("flex flex-col gap-6", styles.enter)}>
              <p className="text-sm font-medium text-muted-foreground">Watch servicing · the Netherlands</p>
              <h1 className="font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                Affordable watch servicing, done carefully by hand.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                I&rsquo;m a hobbyist watchmaker helping people maintain watches that might be too expensive to
                service through official channels. No fancy workshop, just careful hands, cheap rates and a
                genuine love for horology.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonClasses({ size: "lg", className: "min-h-12 px-6" })}>
                  Request a service
                  <ArrowRight />
                </Link>
                <a href="#how-it-works" className={buttonClasses({ variant: "secondary", size: "lg", className: "min-h-12 px-6" })}>
                  How it works
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Free to ask. You get an honest assessment and a price before any work starts.
              </p>
            </div>

            <div className={cn("relative overflow-hidden rounded-2xl shadow-raised", styles.enterPhoto)}>
              <Image
                src={photos.bench.src}
                alt={photos.bench.alt}
                priority
                placeholder="blur"
                sizes="(min-width: 1024px) 560px, 100vw"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </div>
          </Container>
        </section>

        {/* What to expect */}
        <section aria-labelledby="expect" className="border-t border-border py-16 sm:py-24">
          <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <Reveal className="order-last overflow-hidden rounded-2xl lg:order-first">
              <Image
                src={photos.hands.src}
                alt={photos.hands.alt}
                placeholder="blur"
                sizes="(min-width: 1024px) 520px, 100vw"
                className={cn("aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full", styles.develop)}
              />
            </Reveal>
            <div className="flex flex-col gap-8">
              <h2 id="expect" className="font-display text-4xl font-medium tracking-tight text-foreground">
                What to expect
              </h2>
              <ul className="flex flex-col gap-6">
                {EXPECT.map((e) => (
                  <li key={e.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                      <e.icon className="size-4" aria-hidden strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block font-medium text-foreground">{e.title}</span>
                      <span className="mt-1 block text-muted-foreground">{e.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 rounded-xl bg-warning-wash p-5">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning-ink" aria-hidden />
                <p className="text-sm leading-relaxed text-foreground">
                  <strong className="font-semibold">A note on risk:</strong>{" "}I don&rsquo;t carry insurance on pieces
                  in my care. I handle every watch with extreme caution, but if this concerns you, a professional
                  service centre may be a better fit. I&rsquo;m happy to recommend one.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-labelledby="how" className="scroll-mt-16 border-t border-border bg-card py-16 sm:py-24">
          <Container className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-8">
              <h2 id="how" className="font-display text-4xl font-medium tracking-tight text-foreground">
                How it works
              </h2>
              <Reveal threshold={0.25}>
                <ol className="relative flex flex-col gap-7">
                  <span aria-hidden className={cn("absolute bottom-4 left-[15px] top-4 w-px bg-border", styles.drawLine)} />
                  {STEPS.map((s, i) => (
                    <li key={s.title} className={cn("relative flex gap-5", styles.step)}>
                      <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold tabular-nums text-background">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-medium text-foreground">{s.title}</span>
                        <span className="mt-1 block text-muted-foreground">{s.desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
            <div className="hidden overflow-hidden rounded-2xl lg:block">
              <Image
                src={photos.holder.src}
                alt={photos.holder.alt}
                placeholder="blur"
                sizes="520px"
                className="h-full w-full object-cover"
              />
            </div>
          </Container>
        </section>

        {/* Services: live from the catalogue */}
        <section id="services" aria-labelledby="services-title" className="scroll-mt-16 border-t border-border py-16 sm:py-24">
          <Container className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 id="services-title" className="font-display text-4xl font-medium tracking-tight text-foreground">
                What I can help with
              </h2>
              <p className="max-w-xl text-muted-foreground">
                Prices are estimates. I&rsquo;ll always confirm the exact cost after diagnosis.
              </p>
            </div>
            {services === null ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <p className="rounded-xl bg-card p-6 text-muted-foreground shadow-card">
                Describe what your watch needs when you submit a request, and I&rsquo;ll tell you honestly whether I
                can help.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 rounded-xl bg-card p-5 shadow-card">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        from ~{formatCurrency(s.estimatedPrice)}
                      </span>
                    </span>
                    {s.description && <span className="text-sm text-muted-foreground">{s.description}</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted-foreground">
              Have something else in mind? Just describe it when you submit a request.
            </p>
          </Container>
        </section>

        {/* Closing call to action */}
        <section className="pb-16 sm:pb-24">
          <Container>
            <div className="relative overflow-hidden rounded-2xl bg-foreground text-background">
              <Image
                src={photos.movement.src}
                alt=""
                placeholder="blur"
                sizes="(min-width: 1152px) 1088px, 100vw"
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="relative flex flex-col items-start gap-5 px-6 py-14 sm:px-12 sm:py-20">
                <h2 className="max-w-xl font-display text-4xl font-medium tracking-tight">
                  Got a watch that needs attention?
                </h2>
                <p className="max-w-lg text-background/80">
                  Create a free account and submit a request. No obligations. I&rsquo;ll tell you honestly if I can
                  help.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/register"
                    className={buttonClasses({
                      size: "lg",
                      className: "min-h-12 bg-background px-6 text-foreground hover:bg-background/90",
                    })}
                  >
                    Request a service
                    <ArrowRight />
                  </Link>
                  <Link href="/login" className={cn("min-h-11 px-1 py-3 text-sm text-background/85 hover:text-background", drawnUnderline)}>
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <Container className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <BrandMark />
          <p>Hobbyist watch servicing in the Netherlands.</p>
          <p className="text-xs">{PHOTO_CREDIT}</p>
        </Container>
      </footer>
    </div>
  );
}
