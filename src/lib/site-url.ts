/** Public origin of the site, without a trailing slash. Override with NEXT_PUBLIC_APP_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://zojotu.com").replace(/\/+$/, "");
