import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center border border-[#28d8c6] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#28d8c6] transition-colors hover:bg-[#28d8c6]/10 hover:shadow-[0_0_16px_rgba(40,216,198,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:shadow-none',
  {
    variants: {},
    defaultVariants: {}
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
