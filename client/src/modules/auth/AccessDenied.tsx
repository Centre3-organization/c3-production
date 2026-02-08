import { ShieldX, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-[#2C2C2C] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#FF6B6B]/20 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-[#FF6B6B]" />
          </div>
          <CardTitle className="text-2xl font-medium">Access Denied</CardTitle>
          <CardDescription className="text-[#9CA3AF]">
            Your account is not authorized to access Centre3 Security Operations Platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4 text-sm text-[#9CA3AF]">
            <p className="mb-2">This could mean:</p>
            <ul className="list-disc list-inside space-y-1 text-[#9CA3AF]">
              <li>Your account has not been created by an administrator</li>
              <li>Your account has been deactivated</li>
              <li>You're using a different email than registered</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white"
              onClick={() => window.location.href = "mailto:admin@centre3.com?subject=Access%20Request"}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Administrator
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-[#9CA3AF] hover:text-white hover:bg-white/10"
              onClick={() => window.location.href = "/"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
          
          <p className="text-xs text-center text-[#6B6B6B]">
            If you believe this is an error, please contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
