import { Link, useLocation } from "wouter";
import { HardHat, FolderOpen, Calendar, BarChart3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 flex items-center">
          <HardHat className="text-blue-500 mr-2" size={24} />
          ConstructPro
        </h1>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          <Link href="/">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <FolderOpen className="mr-3 h-4 w-4" />
              Projects & Setup
            </Button>
          </Link>
          
          <Link href="/dpr">
            <Button
              variant={isActive("/dpr") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Calendar className="mr-3 h-4 w-4" />
              Daily Reports
            </Button>
          </Link>
          
          <Link href="/analytics">
            <Button
              variant={isActive("/analytics") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <BarChart3 className="mr-3 h-4 w-4" />
              Analytics
            </Button>
          </Link>
          
          <Link href="/chat">
            <Button
              variant={isActive("/chat") ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <Bot className="mr-3 h-4 w-4" />
              AI Assistant
            </Button>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JS</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Smith</p>
            <p className="text-xs text-gray-500">Project Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
