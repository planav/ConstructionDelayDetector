import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProjectForm from "@/components/projects/project-form";

export default function Projects() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <ProjectForm />
        </main>
      </div>
    </div>
  );
}
