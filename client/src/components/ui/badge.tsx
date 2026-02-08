import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#5B2C93] text-white [a&]:hover:bg-[#3D1C5E]",
        secondary:
          "border-transparent bg-[#F5F5F5] text-[#5B2C93] [a&]:hover:bg-[#E8DCF5]",
        destructive:
          "border-transparent bg-[#FF6B6B] text-white [a&]:hover:bg-[#FF6B6B] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-[#E0E0E0] text-[#2C2C2C] [a&]:hover:bg-[#F5F5F5]",
        pending:
          "border-transparent bg-[#FEF3C7] text-[#D97706]",
        approved:
          "border-transparent bg-[#D1FAE5] text-[#059669]",
        rejected:
          "border-transparent bg-[#FFE5E5] text-[#FF6B6B]",
        inProgress:
          "border-transparent bg-[#E8DCF5] text-[#5B2C93]",
        cancelled:
          "border-transparent bg-[#F5F5F5] text-[#6B6B6B]",
        success:
          "border-transparent bg-[#D1FAE5] text-[#059669]",
        warning:
          "border-transparent bg-[#FEF3C7] text-[#D97706]",
        info:
          "border-transparent bg-[#E8DCF5] text-[#5B2C93]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
