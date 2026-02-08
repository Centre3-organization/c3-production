import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#5B2C93] text-white hover:bg-[#3D1C5E] active:scale-[0.98]",
        destructive:
          "bg-[#FF6B6B] text-white hover:bg-[#FF6B6B] active:scale-[0.98] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[#5B2C93] text-[#5B2C93] bg-transparent hover:bg-[#E8DCF5] dark:border-[#E8DCF5] dark:text-[#E8DCF5] dark:hover:bg-[#E8DCF5]/10",
        secondary:
          "bg-[#F5F5F5] text-[#5B2C93] hover:bg-[#E8DCF5]",
        ghost:
          "text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#2C2C2C] dark:hover:bg-white/10",
        link: "text-[#5B2C93] underline-offset-4 hover:underline",
        success:
          "bg-[#4ECDC4] text-white hover:bg-[#3DBDB4] active:scale-[0.98]",
        warning:
          "bg-[#FFB84D] text-white hover:bg-[#FFB84D] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-5 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
