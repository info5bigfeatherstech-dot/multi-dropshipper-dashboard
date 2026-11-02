import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accent?: 'indigo' | 'amber' | 'emerald' | 'blue' | 'rose';
  isActive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  subtext,
  icon,
  accent = 'indigo',
  isActive = false,
  onClick
}) => {
  const accentClasses = {
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600',
      activeBorder: 'ring-2 ring-indigo-500 border-indigo-400'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600',
      activeBorder: 'ring-2 ring-amber-500 border-amber-400'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-400'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600',
      activeBorder: 'ring-2 ring-blue-500 border-blue-400'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600',
      activeBorder: 'ring-2 ring-rose-500 border-rose-400'
    }
  };

  const currentAccent = accentClasses[accent];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`relative bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isActive
          ? currentAccent.activeBorder
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl shrink-0 ${currentAccent.iconBg}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
});

