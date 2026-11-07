import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, type = 'text', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors shadow-2xs',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors resize-y min-h-[90px] shadow-2xs',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-colors shadow-2xs',
            error && 'border-red-500 focus:border-red-500',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
