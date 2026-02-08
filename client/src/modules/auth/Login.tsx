import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle, Loader2, Mail, Lock } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Login() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Store session token in localStorage as fallback for cookie issues
      if (data.sessionToken) {
        localStorage.setItem('app_session_token', data.sessionToken);
      }
      window.location.href = "/";
    },
    onError: (err: any) => {
      setError(err.message || t('auth.loginError'));
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError(t('validation.required'));
      return;
    }

    loginMutation.mutate({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen w-full flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side - Purple Gradient with Logo */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#5B2C93] via-[#5B2C93] to-[#5B2C93] relative overflow-hidden ${isRTL ? 'order-2' : 'order-1'}`}>
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          {/* Logo with background */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-12 py-8 mb-8">
            <div className="flex items-center gap-3">
              {/* Diamond Icon */}
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 5L55 30L30 55L5 30L30 5Z" stroke="white" strokeWidth="2" fill="none"/>
                <path d="M30 15L45 30L30 45L15 30L30 15Z" stroke="white" strokeWidth="2" fill="none"/>
                <circle cx="30" cy="30" r="4" fill="#FF6B6B"/>
              </svg>
              <span className="text-4xl font-medium text-white tracking-wide">center3</span>
            </div>
          </div>
          
          {/* Tagline */}
          <h2 className="text-white text-xl font-medium text-center mb-2">
            Enterprise Data Center Security Operations
          </h2>
          <h3 className="text-white/90 text-lg text-center mb-16">
            & Access Governance Platform
          </h3>
          
          {/* Bottom tagline */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <p className="text-white/80 text-sm tracking-widest">
              Secure • Reliable • Enterprise-Grade
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center bg-[#F5F5F5] ${isRTL ? 'order-1' : 'order-2'}`}>
        <div className="w-full max-w-md px-8">
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-medium text-[#2C2C2C] mb-2">Welcome Back</h1>
              <p className="text-[#6B6B6B] text-sm">Sign in to access your account</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#2C2C2C]">Email</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-4 pr-4 bg-[#F5F5F5] border-[#E0E0E0] rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#2C2C2C]">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-4 pr-12 bg-[#F5F5F5] border-[#E0E0E0] rounded-lg focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B6B6B] ${isRTL ? 'left-4' : 'right-4'}`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label htmlFor="remember" className="text-sm text-[#6B6B6B] cursor-pointer">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-[#5B2C93] hover:bg-[#3D1C5E] text-white font-medium rounded-lg text-base"
              >
                {loginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Language Selector */}
            <div className="mt-6 flex justify-center">
              <LanguageSelector />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B6B6B]">
              <span>© 2026 Centre3</span>
              <span>•</span>
              <a href="#" className="hover:text-[#5B2C93]">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-[#5B2C93]">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
