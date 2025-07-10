import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Bell } from "lucide-react";

export default function Header() {
  const [, navigate] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Project Management Dashboard
          </h2>
          <p className="text-gray-600">
            Manage construction projects with AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/projects")}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
