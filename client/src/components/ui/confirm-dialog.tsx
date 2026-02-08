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
import { AlertTriangle, Trash2, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmDialogVariant = "danger" | "warning" | "success" | "default";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: ConfirmDialogVariant;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantConfig = {
  danger: {
    bg: "bg-[#FFE5E5]",
    icon: Trash2,
    iconColor: "text-[#FF6B6B]",
    confirmButton: "bg-[#FF6B6B] hover:bg-[#FF6B6B] text-white",
  },
  warning: {
    bg: "bg-[#FFF4E5]",
    icon: AlertTriangle,
    iconColor: "text-[#FFB84D]",
    confirmButton: "bg-[#FFB84D] hover:bg-[#E5A544] text-white",
  },
  success: {
    bg: "bg-[#E8F9F8]",
    icon: CheckCircle,
    iconColor: "text-[#4ECDC4]",
    confirmButton: "bg-[#4ECDC4] hover:bg-[#3DBDB4] text-white",
  },
  default: {
    bg: "bg-[#E8DCF5]",
    icon: HelpCircle,
    iconColor: "text-[#5B2C93]",
    confirmButton: "bg-[#5B2C93] hover:bg-[#5B2C93] text-white",
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className={cn("p-3 rounded-full", config.bg)}>
            {icon || <IconComponent className={cn("h-8 w-8", config.iconColor)} />}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 text-center">
          <DialogDescription className="text-base text-muted-foreground">
            {message}
          </DialogDescription>
        </div>

        <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-28"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn("min-w-28", config.confirmButton)}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
interface UseConfirmDialogReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmDialogComponent: React.FC;
}

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmDialogVariant;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  variant: ConfirmDialogVariant;
  confirmText: string;
  cancelText: string;
  resolve?: (value: boolean) => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    variant: "default",
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const confirm = React.useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title,
        message: options.message,
        variant: options.variant || "default",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        resolve,
      });
    });
  }, []);

  const handleClose = React.useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: undefined }));
  }, [state.resolve]);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: undefined }));
  }, [state.resolve]);

  const ConfirmDialogComponent = React.useCallback(() => (
    <ConfirmDialog
      open={state.open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      variant={state.variant}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
    />
  ), [state, handleClose, handleConfirm]);

  return { confirm, ConfirmDialogComponent };
}

// Pre-configured delete confirmation
export function useDeleteConfirm() {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const confirmDelete = React.useCallback((itemName: string, itemType: string = "item") => {
    return confirm({
      title: `Delete ${itemName}`,
      message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
  }, [confirm]);

  return { confirmDelete, ConfirmDialogComponent };
}
