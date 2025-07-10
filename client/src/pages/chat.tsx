import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ChatInterface from "@/components/chat/chat-interface";

export default function Chat() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
}
