import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isValidToken(token: unknown): token is string {
  return typeof token === 'string' && token.length > 10 && token.length < 2048;
}

function isValidAccountId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9-_]{4,64}$/.test(id);
}

function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, accountId, propAccountId } = body;

    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 400 });
    }
    if (!isValidAccountId(accountId)) {
      return NextResponse.json({ error: 'Invalid or missing accountId' }, { status: 400 });
    }
    if (!isValidUUID(propAccountId)) {
      return NextResponse.json({ error: 'Invalid or missing propAccountId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Defense in depth: verify propAccountId belongs to this user (RLS also enforces this)
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', propAccountId)
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 403 });
    }

    const baseUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/history-deals/time`;
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    const toDate = new Date();

    const res = await fetch(
      `${baseUrl}/${fromDate.toISOString()}/${toDate.toISOString()}`,
      { headers: { 'auth-token': token, 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      // Log detail server-side only — never send raw API errors to client
      const errText = await res.text();
      console.error(`[MT5 sync] MetaApi error: status=${res.status}`, errText.slice(0, 500));
      return NextResponse.json({ error: 'Failed to fetch data from MetaApi. Check your token and account ID.' }, { status: 502 });
    }

    const deals: MetaApiDeal[] = await res.json();

    const tradeDealTypes = ['DEAL_TYPE_BUY', 'DEAL_TYPE_SELL'];
    const entryDeals = deals.filter((d) => tradeDealTypes.includes(d.type) && d.entryType === 'DEAL_ENTRY_OUT');

    if (entryDeals.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: 0 });
    }

    const rows = entryDeals.map((deal) => ({
      account_id: propAccountId,
      user_id: user.id,
      date: new Date(deal.time).toISOString().slice(0, 10),
      // Sanitize symbol — only allow safe characters
      symbol: String(deal.symbol ?? 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9./]/g, '').slice(0, 20),
      direction: deal.type === 'DEAL_TYPE_BUY' ? 'long' : 'short',
      position_size: Math.max(0, Number(deal.volume) || 0),
      entry: Math.max(0, Number(deal.price) || 0),
      stop_loss: Math.max(0, Number(deal.stopLoss) || 0),
      take_profit: deal.takeProfit != null ? Math.max(0, Number(deal.takeProfit)) : null,
      exit: deal.price != null ? Math.max(0, Number(deal.price)) : null,
      pnl: deal.profit != null ? Number(deal.profit) : null,
      risk_amount: null,
      risk_percent: null,
      r_multiple: null,
      status: 'closed',
      trading_style: 'day',
      notes: `MetaApi sync — Order #${String(deal.orderId ?? deal.id ?? '').slice(0, 50)}`,
      tags: ['metaapi-sync'],
      mt5_ticket: deal.id != null ? String(deal.id).slice(0, 50) : null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trades')
      .upsert(rows, { onConflict: 'mt5_ticket', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('[MT5 sync] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to save trades. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ inserted: data?.length ?? 0, skipped: rows.length - (data?.length ?? 0) });
  } catch (e) {
    console.error('[MT5 sync] Unexpected error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}

interface MetaApiDeal {
  id?: string | number;
  orderId?: string | number;
  type: string;
  entryType?: string;
  symbol?: string;
  volume?: number;
  price?: number;
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
  time: string;
}
