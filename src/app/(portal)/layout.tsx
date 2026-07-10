import { PortalSidebar } from "@/components/portal/portal-sidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalSidebar />
      <main className="pl-60">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </>
  );
}
