import React from 'react';
import { cn } from '../../lib/utils';
import type { OrderStatus, StockStatus } from '../../types/dropshipper';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: OrderStatus | StockStatus | 'active' | 'admin_approval' | 'pending_payment' | string;
  variant?: 'emerald' | 'amber' | 'blue' | 'teal' | 'rose' | 'indigo' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = 'md',
  className,
  children,
  ...props
}) => {
  // Map domain statuses to design colors
  let chosenVariant = variant;

  if (!chosenVariant && status) {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'in_stock':
      case 'active':
        chosenVariant = 'emerald';
        break;
      case 'pending':
      case 'low_stock':
      case 'admin_approval':
      case 'pending_payment':
        chosenVariant = 'amber';
        break;
      case 'shipped':
        chosenVariant = 'blue';
        break;
      case 'delivered':
        chosenVariant = 'teal';
        break;
      case 'rejected':
      case 'out_of_stock':
        chosenVariant = 'rose';
        break;
      default:
        chosenVariant = 'slate';
    }
  }

  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-600/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-600/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60 ring-blue-600/20',
    teal: 'bg-teal-50 text-teal-700 border-teal-200/60 ring-teal-600/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-600/20',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 ring-indigo-600/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80 ring-slate-600/20',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  // Human friendly label if no children provided
  let label = children;
  if (!label && status) {
    label = status.replace(/_/g, ' ').toUpperCase();
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border transition-colors',
        variantStyles[chosenVariant || 'slate'],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        chosenVariant === 'emerald' && 'bg-emerald-500',
        chosenVariant === 'amber' && 'bg-amber-500',
        chosenVariant === 'blue' && 'bg-blue-500',
        chosenVariant === 'teal' && 'bg-teal-500',
        chosenVariant === 'rose' && 'bg-rose-500',
        chosenVariant === 'indigo' && 'bg-indigo-500',
        chosenVariant === 'slate' && 'bg-slate-400',
      )} />
      {label}
    </span>
  );
};

