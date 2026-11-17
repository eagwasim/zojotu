import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * Only the public site is crawlable. The admin app, customer portal, password flows and
 * API all sit behind a login (or a one-time token), so there is nothing to index there.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The landing page loads its service list from this endpoint in the browser, so
      // crawlers need it to render the page. More specific than the /api/ disallow, so it wins.
      allow: ["/", "/login", "/register", "/api/service-catalog/public"],
      disallow: [
        "/api/",
        "/portal",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/inventory",
        "/parts",
        "/sales",
        "/expenses",
        "/services",
        "/service-catalog",
        "/customers",
        "/settings",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
