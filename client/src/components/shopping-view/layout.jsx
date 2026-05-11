import { Outlet } from "react-router-dom";
import ShoppingHeader from "./header";
import ChatAssistant from "./chat-assistant"; // 1. Import the new file
import AuthModal from "@/components/auth/AuthModal";

function ShoppingLayout() {
  return (
    <div className="flex flex-col bg-white overflow-hidden relative">
      {/* common header */}
      <ShoppingHeader />
      <AuthModal />
      
      <main className="flex flex-col w-full">
        <Outlet />
      </main>

      {/* 2. Add Chat Assistant here */}
      <ChatAssistant /> 
    </div>
  );
}

export default ShoppingLayout;
