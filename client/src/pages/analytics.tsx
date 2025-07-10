import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Charts from "@/components/analytics/charts";

export default function Analytics() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <Charts />
        </main>
      </div>
    </div>
  );
}
