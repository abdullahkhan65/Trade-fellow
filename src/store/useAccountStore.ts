'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account } from '@/types';
import { createBrowserClient } from '@supabase/ssr';

// Use untyped client to avoid schema type conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface AccountStore {
  accounts: Account[];
  activeAccountId: string | null;
  loading: boolean;
  // Derived
  activeAccount: Account | null;
  // Actions
  fetchAccounts: () => Promise<void>;
  setActiveAccount: (id: string) => void;
  createAccount: (account: Omit<Account, 'id' | 'user_id' | 'created_at'>) => Promise<Account | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
      loading: false,
      get activeAccount() {
        const { accounts, activeAccountId } = get();
        return accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;
      },

      fetchAccounts: async () => {
        set({ loading: true });
        const supabase = createClient();
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const accountData = data as Account[];
          set({
            accounts: accountData,
            loading: false,
          });
          // Set active account if none selected
          const { activeAccountId } = get();
          if (!activeAccountId && accountData.length > 0) {
            set({ activeAccountId: accountData[0].id });
          }
        } else {
          set({ loading: false });
        }
      },

      setActiveAccount: (id: string) => {
        set({ activeAccountId: id });
      },

      createAccount: async (accountData) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
          .from('accounts')
          .insert({ ...accountData, user_id: user.id })
          .select()
          .single();

        if (!error && data) {
          const newAccount = data as Account;
          set((state) => ({
            accounts: [...state.accounts, newAccount],
            activeAccountId: newAccount.id,
          }));
          return newAccount;
        }
        return null;
      },

      updateAccount: async (id, updates) => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('accounts')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          set((state) => ({
            accounts: state.accounts.map((a) => a.id === id ? data as Account : a),
          }));
        }
      },

      deleteAccount: async (id) => {
        const supabase = createClient();
        await supabase.from('accounts').delete().eq('id', id);
        set((state) => {
          const remaining = state.accounts.filter((a) => a.id !== id);
          return {
            accounts: remaining,
            activeAccountId: state.activeAccountId === id
              ? (remaining[0]?.id ?? null)
              : state.activeAccountId,
          };
        });
      },
    }),
    {
      name: 'prop-trader-accounts',
      partialize: (state) => ({ activeAccountId: state.activeAccountId }),
    }
  )
);
