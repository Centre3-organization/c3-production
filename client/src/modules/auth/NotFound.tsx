import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-medium text-[#5B2C93]">404</h1>
          <h2 className="text-2xl font-medium text-[#2C2C2C]">Page Not Found</h2>
          <p className="text-[#6B6B6B] max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button onClick={() => setLocation("/")} size="lg">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
