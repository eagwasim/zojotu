import type { Metadata } from "next";
import { LandingPage } from "@/components/site/landing-page";

const title = "Zojotu · Affordable watch servicing in the Netherlands";
const description =
  "Affordable watch servicing, done carefully by hand. A hobbyist watchmaker in the Netherlands " +
  "helping you maintain watches that are too expensive to service through official channels. " +
  "Free assessment and a price before any work starts.";

// The page itself is a client component, so its metadata lives in this server wrapper.
export const metadata: Metadata = {
  // `absolute` skips the "%s · Zojotu" template from the root layout.
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "Zojotu", title, description, locale: "en" },
  twitter: { card: "summary", title, description },
};

export default function Page() {
  return <LandingPage />;
}
