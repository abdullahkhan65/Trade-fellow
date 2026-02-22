-- Migration 002: Goals & Daily Journals
-- Run this in Supabase SQL Editor

-- ─── Goals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id    uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  type          text        NOT NULL CHECK (type IN ('challenge','monthly_profit','consistency','discipline','custom')),
  title         text        NOT NULL,
  description   text,
  target_value  numeric,
  target_unit   text,
  start_date    date        NOT NULL DEFAULT CURRENT_DATE,
  deadline      date,
  config        jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','completed','failed','abandoned')),
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx    ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS goals_account_id_idx ON public.goals(account_id);
CREATE INDEX IF NOT EXISTS goals_status_idx     ON public.goals(status);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'own_goals'
  ) THEN
    CREATE POLICY "own_goals" ON public.goals
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─── Daily Journals ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_journals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          uuid        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  date                date        NOT NULL,
  -- Morning prep
  market_bias         text        CHECK (market_bias IN ('bullish','bearish','neutral','mixed')),
  planned_pairs       text[]      DEFAULT '{}',
  pre_market_notes    text,
  mood_before         smallint    CHECK (mood_before BETWEEN 1 AND 5),
  rules_reviewed      boolean     DEFAULT false,
  -- Evening review
  post_market_notes   text,
  mood_after          smallint    CHECK (mood_after BETWEEN 1 AND 5),
  lessons_learned     text,
  followed_rules      boolean,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, date)
);

CREATE INDEX IF NOT EXISTS daily_journals_user_id_idx       ON public.daily_journals(user_id);
CREATE INDEX IF NOT EXISTS daily_journals_account_date_idx  ON public.daily_journals(account_id, date);

ALTER TABLE public.daily_journals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_journals' AND policyname = 'own_journals'
  ) THEN
    CREATE POLICY "own_journals" ON public.daily_journals
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
