import { Sidebar } from "@/components/dashboard/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#080b12]">
      <Sidebar />
      <main className="w-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 pb-16 pt-14 md:pb-0 md:pt-0 dark:bg-[#080b12]">
        {children}
      </main>
    </div>
  );
}
