'use client';

import { useEffect } from 'react';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useGoalStore } from '@/store/useGoalStore';

export default function DataInit() {
  const { fetchAccounts, activeAccount } = useAccountStore();
  const { fetchTrades } = useTradeStore();
  const { fetchGoals, fetchTodayJournal } = useGoalStore();

  useEffect(() => {
    fetchAccounts();
    fetchGoals();
  }, []);

  useEffect(() => {
    if (activeAccount?.id) {
      fetchTrades(activeAccount.id);
      fetchTodayJournal(activeAccount.id);
    }
  }, [activeAccount?.id]);

  return null;
}
