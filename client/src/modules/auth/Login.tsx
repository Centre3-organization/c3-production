import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Lock, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Cookie name must match the server's COOKIE_NAME
const COOKIE_NAME = "__manus_session";

function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // Set cookie with proper attributes for security
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      // Set the session cookie with the token from server
      if (data.sessionToken) {
        setCookie(COOKIE_NAME, data.sessionToken, rememberMe ? 30 : 1);
      }
      // Redirect to dashboard on successful login
      // Force a page reload to refresh the auth state
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

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4F008C_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-2 bg-primary z-10"></div>

      <Card className="w-full max-w-md z-10 shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CENTRE3</CardTitle>
          <CardDescription className="text-base">
            Enterprise Data Center Security Operations & Access Governance Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  autoComplete="current-password"
                />
                <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                Remember this device for 30 days
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base mt-4" 
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
        <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground pt-4 border-t bg-muted/10">
          <p>Protected by Enterprise Security</p>
          <div className="flex items-center justify-center gap-4 text-xs opacity-70">
            <span>© 2025 CENTRE3</span>
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
