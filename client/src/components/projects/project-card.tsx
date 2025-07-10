import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
}

export default function ProjectCard({ project, onEdit, onView }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-on-track";
      case "delayed":
        return "status-delayed";
      case "critical":
        return "status-critical";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "On Track";
      case "delayed":
        return "Delayed";
      case "critical":
        return "Critical";
      default:
        return status;
    }
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return "progress-bar-success";
    if (progress >= 50) return "progress-bar-warning";
    return "progress-bar-error";
  };

  const progressValue = parseFloat(project.currentProgress);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
        <Badge className={`${getStatusColor(project.status)} text-xs`}>
          {getStatusLabel(project.status)}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">{project.location}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">
            {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>${parseFloat(project.totalBudget).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button
          onClick={() => onEdit(project.id)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          Edit
        </Button>
        <Button
          onClick={() => onView(project.id)}
          variant="secondary"
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
          size="sm"
        >
          View
        </Button>
      </div>
    </div>
  );
}
