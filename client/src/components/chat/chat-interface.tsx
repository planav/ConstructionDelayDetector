import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot, User, History, TrendingUp, DollarSign, AlertTriangle, Settings } from "lucide-react";
import type { Project, ChatMessage } from "@shared/schema";

export default function ChatInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/projects", selectedProjectId, "chat"],
    enabled: !!selectedProjectId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest("POST", `/api/projects/${selectedProjectId}/chat`, {
        message: messageText,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "chat"] });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedProjectId) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    if (!selectedProjectId) {
      toast({
        title: "Select Project",
        description: "Please select a project first to ask questions.",
        variant: "destructive",
      });
      return;
    }
    setMessage(question);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Chat Interface */}
      <Card className="h-96">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              AI Project Assistant
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Select onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {selectedProject && (
            <div className="text-sm text-gray-600">
              Chatting about: <span className="font-medium">{selectedProject.name}</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex flex-col h-80">
          {/* Messages Area */}
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4 pr-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((msg, index) => (
                  <div key={msg.id || index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.isFromUser ? "bg-blue-500" : "bg-gray-600"
                    }`}>
                      {msg.isFromUser ? (
                        <User className="text-white text-sm" />
                      ) : (
                        <Bot className="text-white text-sm" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`rounded-lg p-3 ${
                        msg.isFromUser ? "bg-gray-100" : "bg-blue-50"
                      }`}>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(msg.createdAt || new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                ))
              ) : selectedProjectId ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation about your project</p>
                  <p className="text-sm">Ask me anything about progress, delays, costs, or recommendations</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a project to start chatting</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Message Input */}
          <div className="flex items-center space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedProjectId ? "Ask about your project..." : "Select a project first..."}
              disabled={!selectedProjectId || sendMessageMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || !selectedProjectId || sendMessageMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Suggested Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="text-left p-4 h-auto justify-start"
              onClick={() => handleSuggestedQuestion("What's the current status of my project?")}
            >
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Project Status
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  What's the current status of my project?
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="text-left p-4 h-auto justify-start"
              onClick={() => handleSuggestedQuestion("Show me cost overruns and their causes")}
            >
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget Analysis
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Show me cost overruns and their causes
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="text-left p-4 h-auto justify-start"
              onClick={() => handleSuggestedQuestion("How can I prevent future delays?")}
            >
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delay Prevention
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  How can I prevent future delays?
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="text-left p-4 h-auto justify-start"
              onClick={() => handleSuggestedQuestion("Suggest resource allocation improvements")}
            >
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Resource Optimization
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Suggest resource allocation improvements
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Project Insights */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Project Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Current Progress</div>
                <div className="text-2xl font-bold text-blue-900">
                  {parseFloat(selectedProject.currentProgress)}%
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Status: {selectedProject.status}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Total Budget</div>
                <div className="text-2xl font-bold text-green-900">
                  ${parseFloat(selectedProject.totalBudget).toLocaleString()}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  Location: {selectedProject.location}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Timeline</div>
                <div className="text-lg font-bold text-purple-900">
                  {new Date(selectedProject.startDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-purple-600 mt-1">
                  to {new Date(selectedProject.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
