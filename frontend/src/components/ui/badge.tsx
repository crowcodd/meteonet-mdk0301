import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'bg-ink/[0.06] text-ink-2',
      accent: 'bg-accent-soft text-accent-strong',
      warn: 'bg-warn-soft text-warn',
      bad: 'bg-bad-soft text-bad',
      good: 'bg-good-soft text-good',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
