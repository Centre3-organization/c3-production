import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle, Loader2, Mail, KeyRound, Send } from "lucide-react";
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
    onSuccess: () => {
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
    <div className="min-h-screen w-full flex bg-[#0d0d0d]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Side - Background Image with Branding (smaller) */}
      <div className={`hidden lg:flex lg:w-[45%] relative overflow-hidden ${isRTL ? 'order-2' : 'order-1'}`}>
        {/* Background Image - New blue data center */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/datacenter-bg.jpg')" }}
        />
        
        {/* Dark Overlay */}
        <div className={`absolute inset-0 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/70 via-black/50 to-black/30`} />
        
        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Top Logo */}
          <div className="flex justify-between items-center">
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
          <div className={`flex flex-col ${isRTL ? 'items-end text-right' : 'items-start text-left'} max-w-lg`}>
            {/* Brand Logo Large */}
            <div className="mb-6">
              <img 
                src="/center3-logo-white.png" 
                alt="center3" 
                className="h-16 w-auto mb-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.innerHTML = '<span class="text-4xl font-bold text-white">center<span class="text-[#4f008c]">3</span></span>';
                }}
              />
              {/* Purple accent bar */}
              <div className={`flex items-center gap-0 mt-2`}>
                {isRTL ? (
                  <>
                    <div className="h-1.5 w-6 bg-[#ff375e]"></div>
                    <div className="h-1.5 w-24 bg-[#4f008c]"></div>
                  </>
                ) : (
                  <>
                    <div className="h-1.5 w-24 bg-[#4f008c]"></div>
                    <div className="h-1.5 w-6 bg-[#ff375e]"></div>
                  </>
                )}
              </div>
            </div>
            
            {/* Tagline */}
            <h2 className="text-2xl font-bold text-white mb-3">
              {t('common.tagline')}
            </h2>
            <p className="text-base text-gray-300 leading-relaxed">
              {t('common.description')}
            </p>
            
            {/* Carousel Dots */}
            <div className="flex items-center gap-2 mt-6">
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
              <div className="w-6 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/50"></div>
            </div>
          </div>
          
          {/* Bottom Spacer */}
          <div></div>
        </div>
      </div>

      {/* Right Side - Login Form (bigger) */}
      <div className={`w-full lg:w-[55%] flex flex-col min-h-screen bg-white ${isRTL ? 'order-1' : 'order-2'}`}>
        {/* Language Selector - Top Right */}
        <div className="flex justify-end p-4">
          <LanguageSelector variant="minimal" modal={true} className="text-gray-600 hover:text-gray-900" />
        </div>

        {/* Main Form Container */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <img 
                src="/center3-logo.png" 
                alt="center3" 
                className="h-12 w-auto mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>

            {/* Header */}
            <div className={`mb-10 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('auth.login')}
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
            <form onSubmit={handleLogin} className="space-y-8">
              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 h-5 w-5 text-[#4f008c]`} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t('common.email')}
                    required 
                    className={`h-14 bg-transparent border-0 border-b-2 border-[#4f008c] rounded-none text-gray-900 placeholder:text-[#4f008c] focus:border-[#4f008c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${isRTL ? 'text-right pr-8 pl-0' : 'text-left pl-8 pr-0'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="email"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 h-5 w-5 text-[#4f008c]`} />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.password')}
                    required 
                    className={`h-14 bg-transparent border-0 border-b-2 border-[#4f008c] rounded-none text-gray-900 placeholder:text-[#4f008c] focus:border-[#4f008c] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${isRTL ? 'text-right pr-8 pl-10' : 'text-left pl-8 pr-10'}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 text-[#4f008c] hover:text-[#7333a3] transition-colors`}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-start'}`}>
                <Send className={`h-4 w-4 text-[#ff375e] ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <a href="#" className="text-sm font-medium text-gray-900 underline hover:text-[#4f008c] transition-colors">
                  {t('auth.forgotPassword')}
                </a>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold bg-[#ff375e] hover:bg-[#e62e52] text-white rounded-md transition-all duration-200" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className={`h-5 w-5 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.login')
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 py-4 px-8">
          <div className={`flex items-center justify-center gap-6 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="#" className="hover:text-[#4f008c] transition-colors font-medium">center3</a>
            <a href="#" className="hover:text-[#4f008c] transition-colors">{t('footer.privacyNotice')}</a>
            <a href="#" className="hover:text-[#4f008c] transition-colors">{t('footer.termsOfUse')}</a>
            <a href="#" className="hover:text-[#4f008c] transition-colors">{t('footer.faq')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
