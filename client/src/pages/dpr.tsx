import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import DPRForm from "@/components/dpr/dpr-form";

export default function DPR() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <DPRForm />
        </main>
      </div>
    </div>
  );
}
