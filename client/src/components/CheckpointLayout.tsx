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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-blue-400">🔐 CHECKPOINT</div>
          {title && <div className="text-xl text-slate-300">{title}</div>}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <div className="text-slate-400">Guard:</div>
            <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-red-600 hover:bg-red-700 border-red-500 text-white"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-700 px-6 py-3 text-center text-sm text-slate-400">
        Centre3 Security Checkpoint System v2.0 | {new Date().toLocaleString()}
      </footer>
    </div>
  );
}
