import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface CheckpointLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CheckpointLayout({ children, title }: CheckpointLayoutProps) {
  const [, setLocation] = useLocation();
  // Mock user data - in production, this would come from useAuth()
  const user = { firstName: "Ahmed", lastName: "Al-Rashid" };

  const handleLogout = async () => {
    // Mock logout
    setLocation("/checkpoint/login");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header - Branding Colors */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 border-b border-purple-700 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-white font-poppins">🔐 CHECKPOINT</div>
          {title && <div className="text-xl text-white font-poppins opacity-90">{title}</div>}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm text-white">
            <div className="opacity-80">Guard:</div>
            <div className="font-semibold font-poppins">{user?.firstName} {user?.lastName}</div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white hover:bg-slate-100 text-purple-600 font-semibold font-poppins px-4 py-2"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 px-6 py-3 text-center text-sm text-slate-600">
        <span className="font-poppins">Centre3 Security Checkpoint System v2.0 | {new Date().toLocaleString()}</span>
      </footer>
    </div>
  );
}
