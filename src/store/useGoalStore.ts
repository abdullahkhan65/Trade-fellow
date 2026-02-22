import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Goal, DailyJournal } from '@/types';

interface GoalStore {
  goals: Goal[];
  todayJournal: DailyJournal | null;
  loading: boolean;

  fetchGoals: () => Promise<void>;
  createGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => Promise<Goal | null>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  fetchTodayJournal: (accountId: string) => Promise<void>;
  fetchJournal: (accountId: string, date: string) => Promise<DailyJournal | null>;
  upsertJournal: (
    accountId: string,
    date: string,
    data: Partial<Omit<DailyJournal, 'id' | 'user_id' | 'account_id' | 'created_at' | 'updated_at'>>
  ) => Promise<{ ok: boolean; journal?: DailyJournal; error?: string }>;
}

export const useGoalStore = create<GoalStore>()((set) => ({
  goals: [],
  todayJournal: null,
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GoalStore] fetchGoals error:', error.message);
    } else {
      set({ goals: (data as Goal[]) ?? [] });
    }
    set({ loading: false });
  },

  createGoal: async (goal) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('[GoalStore] createGoal error:', error.message);
      return null;
    }

    set((state) => ({ goals: [data as Goal, ...state.goals] }));
    return data as Goal;
  },

  updateGoal: async (id, updates) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase.from('goals').update(updates).eq('id', id);
    if (error) {
      console.error('[GoalStore] updateGoal error:', error.message);
      return;
    }
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  deleteGoal: async (id) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) {
      console.error('[GoalStore] deleteGoal error:', error.message);
      return;
    }
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
  },

  fetchTodayJournal: async (accountId) => {
    const today = new Date().toISOString().slice(0, 10);
    const journal = await useGoalStore.getState().fetchJournal(accountId, today);
    set({ todayJournal: journal });
  },

  fetchJournal: async (accountId, date) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from('daily_journals')
        .select('*')
        .eq('account_id', accountId)
        .eq('date', date)
        .maybeSingle();

      if (error) {
        console.error('[GoalStore] fetchJournal error:', error.message);
        return null;
      }

      return (data as DailyJournal | null) ?? null;
    } catch (e) {
      console.error('[GoalStore] fetchJournal exception:', e);
      return null;
    }
  },

  upsertJournal: async (accountId, date, data) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, error: 'You must be logged in to save journal entries.' };

      const payload = {
        user_id: user.id,
        account_id: accountId,
        date,
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('daily_journals')
        .upsert(payload, { onConflict: 'account_id,date' })
        .select()
        .single();

      if (error) {
        console.error('[GoalStore] upsertJournal error:', error.message);
        return { ok: false, error: error.message };
      }

      const today = new Date().toISOString().slice(0, 10);
      if (date === today) {
        set({ todayJournal: result as DailyJournal });
      }

      return { ok: true, journal: result as DailyJournal };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected error while saving journal.';
      console.error('[GoalStore] upsertJournal exception:', e);
      return { ok: false, error: msg };
    }
  },
}));
