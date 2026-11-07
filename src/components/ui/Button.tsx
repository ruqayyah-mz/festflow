import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-xs active:bg-blue-800',
      secondary:
        'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 active:bg-blue-200',
      outline:
        'border border-slate-300 bg-white text-slate-800 hover:bg-blue-50/50 hover:border-blue-600 hover:text-blue-600 shadow-xs',
      danger:
        'border border-red-600 bg-red-600 text-white hover:bg-red-700',
      ghost:
        'bg-transparent text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs tracking-tight',
      md: 'h-9 px-4 text-sm tracking-tight',
      lg: 'h-11 px-6 text-base tracking-tight',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
