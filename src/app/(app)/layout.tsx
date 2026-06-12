import { Sidebar } from "@/components/dashboard/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 pt-14 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
}
