import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ComprehensiveCharts from "@/components/analytics/comprehensive-charts";
import AIAnalysisDashboard from "@/components/analytics/ai-analysis-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Analytics() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive project analytics, AI-powered predictions, and performance insights
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Project Overview</TabsTrigger>
                <TabsTrigger value="ai-analysis">AI Analysis & Predictions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <ComprehensiveCharts />
              </TabsContent>

              <TabsContent value="ai-analysis">
                <AIAnalysisDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
