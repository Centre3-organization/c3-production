import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

function Textarea({
  className,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}: React.ComponentProps<"textarea">) {
  // Get dialog composition context if available (will be no-op if not inside Dialog)
  const dialogComposition = useDialogComposition();

  // Add composition event handlers to support input method editor (IME) for CJK languages.
  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLTextAreaElement>({
    onKeyDown: (e) => {
      // Check if this is an Enter key that should be blocked
      const isComposing = (e.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();

      // If Enter key is pressed while composing or just after composition ended,
      // don't call the user's onKeyDown (this blocks the business logic)
      // Note: For textarea, Shift+Enter should still work for newlines
      if (e.key === "Enter" && !e.shiftKey && isComposing) {
        return;
      }

      // Otherwise, call the user's onKeyDown
      onKeyDown?.(e);
    },
    onCompositionStart: e => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(e);
    },
    onCompositionEnd: e => {
      // Mark that composition just ended - this helps handle the Enter key that confirms input
      dialogComposition.markCompositionEnd();
      // Delay setting composing to false to handle Safari's event order
      // In Safari, compositionEnd fires before the ESC keydown event
      setTimeout(() => {
        dialogComposition.setComposing(false);
      }, 100);
      onCompositionEnd?.(e);
    },
  });

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[#E0E0E0] placeholder:text-[#9CA3AF] focus-visible:border-[#5B2C93] focus-visible:border-2 focus-visible:ring-[#5B2C93]/10 aria-invalid:ring-[#FF6B6B]/20 dark:aria-invalid:ring-[#FF6B6B]/40 aria-invalid:border-[#FF6B6B] aria-invalid:bg-[#FFE5E5] dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#2C2C2C] shadow-xs transition-[color,box-shadow,border-color] duration-150 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F5F5F5]",
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export { Textarea };
