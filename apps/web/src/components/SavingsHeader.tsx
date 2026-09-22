'use client';

import React from 'react';
import { PiggyBank, Flame } from 'lucide-react';

interface SavingsHeaderProps {
  savingsTotal: number; // in ZMW
  streakDays: number;
}

export const SavingsHeader: React.FC<SavingsHeaderProps> = ({ savingsTotal, streakDays }) => {
  return (
    <header className="bg-emerald-700 text-white p-4 shadow-md rounded-b-xl flex justify-between items-center">
      <div>
        <div className="flex items-center space-x-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
          <PiggyBank className="w-4 h-4" />
          <span>Lifetime Savings</span>
        </div>
        <div className="text-2xl font-bold mt-0.5">
          ZMW {savingsTotal.toFixed(2)}
        </div>
      </div>

      <div className="flex items-center space-x-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-full border border-emerald-600/50">
        <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="text-xs font-bold text-amber-200">{streakDays} Streak</span>
      </div>
    </header>
  );
};
