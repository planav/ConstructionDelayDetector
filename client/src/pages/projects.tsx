import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProjectForm from "@/components/projects/project-form";

export default function Projects() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ProjectForm />
        </main>
      </div>
    </div>
  );
}
