import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded bg-[#d5dcff] px-4 py-2.5 text-sm font-semibold text-[#1a1b26] transition-colors hover:bg-[#7aa2f7] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#d5dcff] disabled:hover:text-[#1a1b26]',
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
