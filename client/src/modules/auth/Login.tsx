import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: any) => {
      setError(err.message || "Login failed. Please check your credentials.");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Background Pattern - Center3 brand pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4f008c_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>
      
      {/* Top brand bar - Center3 Purple */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#4f008c] z-10"></div>

      <Card className="w-full max-w-md z-10 shadow-xl border-t-4 border-t-[#4f008c]">
        <CardHeader className="space-y-1 text-center pb-6">
          {/* Center3 Logo */}
          <div className="mx-auto mb-4">
            <img 
              src="/center3-logo.png" 
              alt="center3" 
              className="h-16 w-auto"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<h1 class="text-2xl font-bold text-[#4f008c]">center3</h1>';
              }}
            />
          </div>
          <CardDescription className="text-base text-[#8e9aa5]">
            Enterprise Data Center Security Operations & Access Governance Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 border-[#ff375e] bg-[#ff375e]/10">
              <AlertCircle className="h-4 w-4 text-[#ff375e]" />
              <AlertDescription className="text-[#ff375e]">{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4f008c] font-medium">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="h-11 border-[#dedfe2] focus:border-[#4f008c] focus:ring-[#4f008c]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#4f008c] font-medium">Password</Label>
                <a href="#" className="text-sm font-medium text-[#ff375e] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="h-11 pr-10 border-[#dedfe2] focus:border-[#4f008c] focus:ring-[#4f008c]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  autoComplete="current-password"
                />
                <Lock className="absolute right-3 top-3 h-5 w-5 text-[#8e9aa5]" />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="border-[#8e9aa5] data-[state=checked]:bg-[#4f008c] data-[state=checked]:border-[#4f008c]"
              />
              <Label htmlFor="remember" className="text-sm font-normal text-[#8e9aa5]">
                Remember this device for 30 days
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base mt-4 bg-[#4f008c] hover:bg-[#7333a3] text-white" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-[#8e9aa5] pt-4 border-t bg-[#dedfe2]/20">
          <p>Protected by Enterprise Security</p>
          <div className="flex items-center justify-center gap-4 text-xs opacity-70">
            <span>© 2025 center3</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
