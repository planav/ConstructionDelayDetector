import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import DPRForm from "@/components/dpr/dpr-form";
import { DPRHistory } from "@/components/dpr/dpr-history";
import { Button } from "@/components/ui/button";
import { Plus, History } from "lucide-react";

export default function DPR() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Daily Project Reports</h1>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'form' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('form')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Submit DPR
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-2"
                  disabled={!selectedProjectId}
                >
                  <History className="h-4 w-4" />
                  View History
                </Button>
              </div>
            </div>
          </div>

          {activeTab === 'form' ? (
            <DPRForm onProjectSelect={setSelectedProjectId} />
          ) : (
            selectedProjectId && <DPRHistory projectId={selectedProjectId} />
          )}
        </main>
      </div>
    </div>
  );
}
