import Sidebar from "@/components/sidebar";
import Nav from "@/components/nav";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-deep-navy">
      <Sidebar />
      <div className="flex flex-col flex-1 md:pl-64">
        <Nav />
        <main className="w-full h-full px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
