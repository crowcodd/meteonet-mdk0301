import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'group inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-[transform,background-color,box-shadow,color] duration-300 ease-out-expo active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-accent-strong',
        secondary: 'bg-surface text-ink ring-1 ring-line hover:bg-white hover:ring-ink/15',
        danger: 'bg-bad-soft text-bad hover:bg-bad hover:text-white',
        ghost: 'text-ink-2 hover:bg-ink/[0.05] hover:text-ink',
      },
      size: {
        sm: 'h-8 px-3.5 text-[13px]',
        md: 'h-10 px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { trailing?: ReactNode };

export function Button({ className, variant, size, type = 'button', trailing, children, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), trailing && 'pr-1.5', className)}
      {...props}
    >
      {children}
      {trailing && (
        <span className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5">
          {trailing}
        </span>
      )}
    </button>
  );
}
