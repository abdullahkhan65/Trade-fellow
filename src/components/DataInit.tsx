'use client';

import { useEffect } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useGoalStore } from '@/store/useGoalStore';
import { accountToSettings } from '@/types';

export default function DataInit() {
  const { fetchAccounts, activeAccount } = useAccountStore();
  const { fetchTrades, updateSettings } = useTradeStore();
  const { fetchGoals, fetchTodayJournal } = useGoalStore();

  useEffect(() => {
    fetchAccounts();
    fetchGoals();
  }, []);

  useEffect(() => {
    if (activeAccount?.id) {
      fetchTrades(activeAccount.id);
      fetchTodayJournal(activeAccount.id);
      // Sync active account risk parameters into the trade store so all
      // dashboard components (RiskDashboard, calculators, etc.) stay in sync.
      updateSettings(accountToSettings(activeAccount));
    }
  }, [activeAccount?.id]);

  return null;
}
