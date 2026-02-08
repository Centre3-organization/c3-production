import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ErrorDialogType = "error" | "warning" | "info";

interface ErrorDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: ErrorDialogType;
  buttonText?: string;
  details?: string;
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  error: {
    bg: "bg-[#FFE5E5]",
    icon: "text-[#FF6B6B]",
    border: "border-[#FF6B6B]",
    button: "bg-[#FF6B6B] hover:bg-[#FF6B6B] text-white",
  },
  warning: {
    bg: "bg-[#FEF3C7]",
    icon: "text-[#D97706]",
    border: "border-[#D97706]",
    button: "bg-[#D97706] hover:bg-[#B45309] text-white",
  },
  info: {
    bg: "bg-[#E8DCF5]",
    icon: "text-[#5B2C93]",
    border: "border-[#5B2C93]",
    button: "bg-[#5B2C93] hover:bg-[#3D1C5E] text-white",
  },
};

const titleMap = {
  error: "Error",
  warning: "Warning",
  info: "Information",
};

export function ErrorDialog({
  open,
  onClose,
  title,
  message,
  type = "error",
  buttonText = "OK",
  details,
}: ErrorDialogProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];
  const defaultTitle = titleMap[type];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className={cn("p-3 rounded-full", colors.bg)}>
            <Icon className={cn("h-8 w-8", colors.icon)} />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {title || defaultTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 text-center">
          <DialogDescription className="text-base text-muted-foreground">
            {message}
          </DialogDescription>
          
          {details && (
            <div className={cn(
              "mt-4 p-3 rounded-lg text-sm text-left font-mono overflow-auto max-h-32",
              colors.bg,
              "border",
              colors.border
            )}>
              {details}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onClose}
            className={cn("min-w-32", colors.button)}
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
interface UseErrorDialogReturn {
  showError: (message: string, title?: string, details?: string) => void;
  showWarning: (message: string, title?: string, details?: string) => void;
  showInfo: (message: string, title?: string, details?: string) => void;
  ErrorDialogComponent: React.FC;
}

interface ErrorDialogState {
  open: boolean;
  type: ErrorDialogType;
  title?: string;
  message: string;
  details?: string;
}

export function useErrorDialog(): UseErrorDialogReturn {
  const [state, setState] = React.useState<ErrorDialogState>({
    open: false,
    type: "error",
    message: "",
  });

  const showError = React.useCallback((message: string, title?: string, details?: string) => {
    setState({ open: true, type: "error", message, title, details });
  }, []);

  const showWarning = React.useCallback((message: string, title?: string, details?: string) => {
    setState({ open: true, type: "warning", message, title, details });
  }, []);

  const showInfo = React.useCallback((message: string, title?: string, details?: string) => {
    setState({ open: true, type: "info", message, title, details });
  }, []);

  const handleClose = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const ErrorDialogComponent = React.useCallback(() => (
    <ErrorDialog
      open={state.open}
      onClose={handleClose}
      type={state.type}
      title={state.title}
      message={state.message}
      details={state.details}
    />
  ), [state, handleClose]);

  return { showError, showWarning, showInfo, ErrorDialogComponent };
}
