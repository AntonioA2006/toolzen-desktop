// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-[#1e4fd0] text-white hover:bg-[#1a44b8] disabled:bg-[#c5cedd] disabled:text-[#3d4658]",
        secondary: "border-line bg-elevated hover:bg-muted",
        ghost: "border-transparent bg-transparent hover:bg-muted",
        danger: "border-transparent bg-transparent text-danger hover:bg-muted",
      },
      size: {
        sm: "h-8 px-2.5",
        md: "h-9 px-3",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
