import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProjectForm from "@/components/projects/project-form";
import ProjectEditForm from "@/components/projects/project-edit-form";

export default function Projects() {
  const [location] = useLocation();
  const [editProjectId, setEditProjectId] = useState<number | null>(null);

  useEffect(() => {
    // Parse URL parameters properly
    const url = new URL(window.location.href);
    const editId = url.searchParams.get('edit');

    if (editId && !isNaN(parseInt(editId))) {
      setEditProjectId(parseInt(editId));
    } else {
      setEditProjectId(null);
    }
  }, [location]);

  const handleCancelEdit = () => {
    setEditProjectId(null);
    // Update URL to remove edit parameter
    window.history.pushState({}, '', '/projects');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          {editProjectId ? (
            <ProjectEditForm
              projectId={editProjectId}
              onCancel={handleCancelEdit}
            />
          ) : (
            <ProjectForm />
          )}
        </main>
      </div>
    </div>
  );
}
