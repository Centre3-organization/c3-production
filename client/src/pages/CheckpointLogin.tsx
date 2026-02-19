import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export function CheckpointLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Mock login - in production, this would call trpc.auth.login
      if (!email || !password) {
        setError("Please enter email and password");
        return;
      }

      // Simulate login delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login
      if (email.includes("guard") || email.includes("security")) {
        setLocation("/checkpoint");
      } else {
        setError("Only security guards can access the checkpoint interface");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-2">CHECKPOINT</h1>
            <p className="text-slate-400">Security Guard Interface v2.0</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-900 border-red-700">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="guard@centre3.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 h-11"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 h-11"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold h-11"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Demo Credentials:</p>
            <p className="text-xs text-slate-300">Email: guard@centre3.com</p>
            <p className="text-xs text-slate-300">Password: password123</p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700 text-center text-xs text-slate-400">
            <p>Centre3 Security Checkpoint System</p>
            <p>Authorized Personnel Only</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
