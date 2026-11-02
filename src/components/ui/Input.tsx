import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, leftAddon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-xs flex">
          {leftAddon && (
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200/90 bg-slate-50/90 text-slate-700 text-xs font-bold select-none shrink-0">
              {leftAddon}
            </span>
          )}
          <div className="relative flex-1 min-w-0">
            {leftIcon && (
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {leftIcon}
              </div>
            )}
            <input
              ref={ref}
              id={inputId}
              className={cn(
                'block w-full border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition duration-150',
                leftAddon ? 'rounded-r-xl' : 'rounded-xl',
                'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900',
                className
              )}
              {...props}
            />
            {rightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 z-10">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
