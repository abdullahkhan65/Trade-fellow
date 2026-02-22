'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, Settings } from '@/types';
import { sampleTrades } from '@/lib/sampleData';
import { calculateRisk, calculatePnL, calculateRMultiple } from '@/lib/calculations';
import { createBrowserClient } from '@supabase/ssr';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface TradeStore {
  trades: Trade[];
  settings: Settings;
  loading: boolean;
  // Supabase actions
  fetchTrades: (accountId: string) => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id' | 'riskAmount' | 'riskPercent' | 'pnl' | 'rMultiple'>, accountId?: string) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  closeTrade: (id: string, exit: number) => Promise<void>;
  bulkInsertTrades: (trades: Omit<Trade, 'id' | 'riskAmount' | 'riskPercent' | 'pnl' | 'rMultiple'>[], accountId: string) => Promise<{ inserted: number; skipped: number }>;
  // Settings
  updateSettings: (settings: Partial<Settings>) => void;
  // Local fallback
  loadSampleData: () => void;
  clearAllTrades: () => void;
}

const defaultSettings: Settings = {
  accountSize: 100000,
  startingBalance: 100000,
  maxDailyRiskPercent: 5,
  maxDrawdownPercent: 10,
  profitTargetPercent: 10,
  tradingStyle: 'day',
  currency: 'USD',
  trailingDrawdown: false,
};

function computeTradeFields(tradeInput: Partial<Trade>, settings: Settings): Partial<Trade> {
  const { riskAmount, riskPercent } = tradeInput.entry && tradeInput.stopLoss && tradeInput.positionSize
    ? calculateRisk(tradeInput.entry, tradeInput.stopLoss, tradeInput.positionSize, settings.startingBalance, tradeInput.direction!)
    : { riskAmount: 0, riskPercent: 0 };

  let pnl: number | null = null;
  let rMultiple: number | null = null;

  if (tradeInput.status === 'closed' && tradeInput.exit && tradeInput.entry && tradeInput.positionSize) {
    pnl = calculatePnL(tradeInput.entry, tradeInput.exit, tradeInput.positionSize, tradeInput.direction!);
    if (tradeInput.stopLoss) {
      rMultiple = calculateRMultiple(tradeInput.entry, tradeInput.exit, tradeInput.stopLoss, tradeInput.direction!);
    }
  }

  return { riskAmount, riskPercent, pnl, rMultiple };
}

// Map Supabase row → Trade
function dbRowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    account_id: row.account_id as string,
    user_id: row.user_id as string,
    date: row.date as string,
    symbol: row.symbol as string,
    direction: row.direction as Trade['direction'],
    positionSize: row.position_size as number,
    entry: row.entry as number,
    stopLoss: row.stop_loss as number,
    takeProfit: row.take_profit as number | null,
    exit: row.exit as number | null,
    pnl: row.pnl as number | null,
    riskAmount: (row.risk_amount as number) ?? 0,
    riskPercent: (row.risk_percent as number) ?? 0,
    rMultiple: row.r_multiple as number | null,
    status: row.status as Trade['status'],
    tradingStyle: row.trading_style as Trade['tradingStyle'],
    notes: (row.notes as string) ?? '',
    tags: (row.tags as string[]) ?? [],
    mt5_ticket: row.mt5_ticket as string | null,
  };
}

// Map Trade → Supabase insert row
function tradeToDbRow(trade: Partial<Trade> & { account_id: string; user_id: string }) {
  return {
    account_id: trade.account_id,
    user_id: trade.user_id,
    date: trade.date,
    symbol: trade.symbol,
    direction: trade.direction,
    position_size: trade.positionSize,
    entry: trade.entry,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit ?? null,
    exit: trade.exit ?? null,
    pnl: trade.pnl ?? null,
    risk_amount: trade.riskAmount ?? null,
    risk_percent: trade.riskPercent ?? null,
    r_multiple: trade.rMultiple ?? null,
    status: trade.status ?? 'closed',
    trading_style: trade.tradingStyle,
    notes: trade.notes ?? '',
    tags: trade.tags ?? [],
    mt5_ticket: trade.mt5_ticket ?? null,
  };
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      settings: defaultSettings,
      loading: false,

      fetchTrades: async (accountId: string) => {
        set({ loading: true });
        const supabase = createClient();
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .eq('account_id', accountId)
          .order('date', { ascending: false });

        if (!error && data) {
          set({ trades: data.map(dbRowToTrade), loading: false });
        } else {
          set({ loading: false });
        }
      },

      addTrade: async (tradeInput, accountId) => {
        const { settings } = get();
        const computed = computeTradeFields(tradeInput, settings);
        const full = { ...tradeInput, ...computed };

        // Try Supabase if accountId provided
        if (accountId) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('trades')
              .insert(tradeToDbRow({ ...full, account_id: accountId, user_id: user.id } as Trade & { account_id: string; user_id: string }))
              .select()
              .single();

            if (!error && data) {
              set((state) => ({ trades: [dbRowToTrade(data as Record<string, unknown>), ...state.trades] }));
              return;
            }
          }
        }

        // Local fallback
        set((state) => ({
          trades: [{ ...full, id: Date.now().toString(), account_id: accountId ?? 'local' } as Trade, ...state.trades],
        }));
      },

      updateTrade: async (id, tradeUpdate) => {
        const { settings } = get();
        set((state) => ({
          trades: state.trades.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, ...tradeUpdate };
            const computed = computeTradeFields(updated, settings);
            return { ...updated, ...computed };
          }),
        }));

        // Sync to Supabase
        const trade = get().trades.find((t) => t.id === id);
        if (trade?.account_id && trade.account_id !== 'local') {
          const supabase = createClient();
          const computed = computeTradeFields({ ...trade, ...tradeUpdate }, settings);
          const full = { ...trade, ...tradeUpdate, ...computed };
          await supabase.from('trades').update({
            date: full.date,
            symbol: full.symbol,
            direction: full.direction,
            position_size: full.positionSize,
            entry: full.entry,
            stop_loss: full.stopLoss,
            take_profit: full.takeProfit,
            exit: full.exit,
            pnl: full.pnl,
            risk_amount: full.riskAmount,
            risk_percent: full.riskPercent,
            r_multiple: full.rMultiple,
            status: full.status,
            trading_style: full.tradingStyle,
            notes: full.notes,
            tags: full.tags,
          }).eq('id', id);
        }
      },

      deleteTrade: async (id) => {
        const trade = get().trades.find((t) => t.id === id);
        set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }));

        if (trade?.account_id && trade.account_id !== 'local') {
          const supabase = createClient();
          await supabase.from('trades').delete().eq('id', id);
        }
      },

      closeTrade: async (id, exit) => {
        const trade = get().trades.find((t) => t.id === id);
        if (!trade) return;
        const pnl = calculatePnL(trade.entry, exit, trade.positionSize, trade.direction);
        const rMultiple = calculateRMultiple(trade.entry, exit, trade.stopLoss, trade.direction);

        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === id ? { ...t, exit, pnl, rMultiple, status: 'closed' } : t
          ),
        }));

        if (trade.account_id && trade.account_id !== 'local') {
          const supabase = createClient();
          await supabase.from('trades').update({ exit, pnl, r_multiple: rMultiple, status: 'closed' }).eq('id', id);
        }
      },

      bulkInsertTrades: async (tradesInput, accountId) => {
        const { settings } = get();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { inserted: 0, skipped: 0 };

        const rows = tradesInput.map((t) => {
          const computed = computeTradeFields(t, settings);
          return tradeToDbRow({
            ...t, ...computed,
            account_id: accountId,
            user_id: user.id,
          } as Trade & { account_id: string; user_id: string });
        });

        // Use upsert with onConflict on mt5_ticket to skip duplicates
        const { data, error } = await supabase
          .from('trades')
          .upsert(rows, { onConflict: 'mt5_ticket', ignoreDuplicates: true })
          .select();

        if (!error && data) {
          const newTrades = data.map(dbRowToTrade);
          set((state) => ({
            trades: [...newTrades, ...state.trades.filter((t) => !newTrades.find((n: Trade) => n.id === t.id))],
          }));
          return { inserted: data.length, skipped: rows.length - data.length };
        }

        return { inserted: 0, skipped: rows.length };
      },

      updateSettings: (settingsUpdate) => {
        set((state) => ({ settings: { ...state.settings, ...settingsUpdate } }));
      },

      loadSampleData: () => {
        set({ trades: sampleTrades });
      },

      clearAllTrades: () => {
        set({ trades: [] });
      },
    }),
    {
      name: 'prop-trader-store',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
