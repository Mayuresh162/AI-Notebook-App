import Sidebar from "@/components/Sidebar";
import ChatLayout from "@/components/ChatLayout";
import SidebarDrawer from "@/components/SidebarDrawer";
import UserMenu from "@/components/UserMenu";

export default function Home() {
  return (
    <div className="h-screen bg-[#0a0a0a] overflow-hidden md:p-4">

      {/* Mobile Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:hidden">
  
      <div className="flex items-center gap-3">
        <SidebarDrawer>
          <Sidebar />
        </SidebarDrawer>

        <span className="font-medium">AI Notebook</span>
      </div>

      <UserMenu />
    </header>

      <div className="h-full flex overflow-hidden rounded-none md:rounded-3xl border border-white/5 bg-[#111111]">

        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Chat */}
        <ChatLayout />
      </div>

    </div>
  );
}