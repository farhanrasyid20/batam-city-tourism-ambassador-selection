import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * Variasi gaya tombol reusable berbasis CVA.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-goldMain/50",
  {
    variants: {
      variant: {
        // ✅ Luxury Gold Primary
        gold: "bg-gold-gradient text-elegantBlack shadow-gold-glow hover:opacity-95",

        // ✅ Luxury Outline Gold
        goldOutline:
          "border border-goldMain text-goldLight bg-transparent hover:bg-darkBg",

        // Optional basic
        default: "bg-white text-black hover:opacity-90",
        ghost: "hover:bg-white/10 text-softCream",
        link: "text-goldLight underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 rounded-xl2 text-sm",
        sm: "h-9 px-4 rounded-xl text-sm",
        lg: "h-12 px-8 rounded-xl2 text-base",
        icon: "h-10 w-10 rounded-xl2",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "default",
      fullWidth: false,
    },
  }
);

/**
 * Komponen tombol UI generik dengan dukungan variant, size,
 * mode asChild, dan opsi fullWidth.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  fullWidth,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
