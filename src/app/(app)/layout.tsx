import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="pl-60">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </>
  );
}
