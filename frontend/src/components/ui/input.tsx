import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const base =
  'w-full rounded-xl bg-white px-3.5 text-[15px] text-ink ring-1 ring-line transition-shadow duration-200 ease-out-expo placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:bg-canvas disabled:text-ink-3 aria-invalid:ring-2 aria-invalid:ring-bad/50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-11', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(base, 'h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10', className)} style={{ backgroundImage: CHEVRON }} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'min-h-24 py-2.5', className)} {...props} />;
}

// стрелка у select рисуется фоном, чтобы не тащить отдельный компонент
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='none' stroke='%2369707c' stroke-linecap='round' stroke-linejoin='round' stroke-width='16' d='m208 96-80 80-80-80'/%3E%3C/svg%3E\")";
