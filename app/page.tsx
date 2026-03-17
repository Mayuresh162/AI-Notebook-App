import Sidebar from "@/components/Sidebar";
import ChatLayout from "@/components/ChatLayout";

export default function Home() {
  return (
    <div className="h-screen bg-background p-6">
      <div className="h-full rounded-2xl border bg-card flex overflow-hidden">
        <Sidebar />
        <ChatLayout />
      </div>
    </div>
  );
}
