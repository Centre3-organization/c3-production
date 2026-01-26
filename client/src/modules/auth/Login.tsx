import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full flex bg-[#0d0d0d]">
      {/* Left Side - Background Image with Branding */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top Logo */}
          <div>
            <img 
              src="/center3-logo-white.png" 
              alt="center3" 
              className="h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Center Branding */}
          <div className="flex flex-col items-start max-w-xl">
            {/* Brand Logo Large */}
            <div className="mb-8">
              <img 
                src="/center3-logo-white.png" 
                alt="center3" 
                className="h-20 w-auto mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.innerHTML = '<span class="text-5xl font-bold text-white">center<span class="text-[#4f008c]">3</span></span>';
                }}
              />
              {/* Purple accent bar */}
              <div className="flex items-center gap-0 mt-2">
                <div className="h-1.5 w-32 bg-[#4f008c]"></div>
                <div className="h-1.5 w-8 bg-[#ff375e]"></div>
              </div>
            </div>
            
            {/* Tagline */}
            <h2 className="text-3xl font-bold text-white mb-4">
              The Future of Access Control
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Enterprise-grade security operations and access governance platform, 
              navigating data centers and organizations towards secure and efficient operations.
            </p>
            
            {/* Carousel Dots */}
            <div className="flex items-center gap-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
              <div className="w-8 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
            </div>
          </div>
          
          {/* Bottom Spacer */}
          <div></div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12 bg-[#1a1a1a]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <img 
              src="/center3-logo-white.png" 
              alt="center3" 
              className="h-12 w-auto mx-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-1">experience</p>
            <h1 className="text-3xl font-bold text-white">
              center<span className="text-[#4f008c]">3</span> access ..
            </h1>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6 border-[#ff375e] bg-[#ff375e]/10">
              <AlertCircle className="h-4 w-4 text-[#ff375e]" />
              <AlertDescription className="text-[#ff375e]">{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username/Email Field */}
            <div className="space-y-2">
              <Input 
                id="email" 
                type="email" 
                placeholder="Username"
                required 
                className="h-14 bg-transparent border-0 border-b border-gray-600 rounded-none text-white placeholder:text-gray-500 focus:border-[#4f008c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required 
                  className="h-14 bg-transparent border-0 border-b border-gray-600 rounded-none text-white placeholder:text-gray-500 focus:border-[#4f008c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-gray-500 data-[state=checked]:bg-[#4f008c] data-[state=checked]:border-[#4f008c]"
                />
                <Label htmlFor="remember" className="text-sm font-normal text-white">
                  Remember me
                </Label>
              </div>
              <a href="#" className="text-sm font-medium text-white hover:text-gray-300 transition-colors">
                Forgot your credentials?
              </a>
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold mt-6 bg-[#4f008c] hover:bg-[#7333a3] text-white rounded-md transition-all duration-200" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
}
