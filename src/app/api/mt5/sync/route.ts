import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { token, accountId, propAccountId } = await req.json();

    if (!token || !accountId || !propAccountId) {
      return NextResponse.json({ error: 'Missing token, accountId, or propAccountId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch deals from MetaApi REST API
    const baseUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/history-deals/time`;
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);
    const toDate = new Date();

    const res = await fetch(
      `${baseUrl}/${fromDate.toISOString()}/${toDate.toISOString()}`,
      { headers: { 'auth-token': token, 'Content-Type': 'application/json' } }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `MetaApi error: ${res.status} ${errText}` }, { status: 502 });
    }

    const deals: MetaApiDeal[] = await res.json();

    // Filter only buy/sell deals (not balance/commission/etc)
    const tradeDealTypes = ['DEAL_TYPE_BUY', 'DEAL_TYPE_SELL'];
    const entryDeals = deals.filter((d) => tradeDealTypes.includes(d.type) && d.entryType === 'DEAL_ENTRY_OUT');

    if (entryDeals.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: 0 });
    }

    // Map to trades
    const rows = entryDeals.map((deal) => ({
      account_id: propAccountId,
      user_id: user.id,
      date: new Date(deal.time).toISOString().slice(0, 10),
      symbol: deal.symbol ?? 'UNKNOWN',
      direction: deal.type === 'DEAL_TYPE_BUY' ? 'long' : 'short',
      position_size: deal.volume ?? 0,
      entry: deal.price ?? 0,
      stop_loss: deal.stopLoss ?? 0,
      take_profit: deal.takeProfit ?? null,
      exit: deal.price ?? null,
      pnl: deal.profit ?? null,
      risk_amount: null,
      risk_percent: null,
      r_multiple: null,
      status: 'closed',
      trading_style: 'day',
      notes: `MetaApi sync — Order #${deal.orderId ?? deal.id}`,
      tags: ['metaapi-sync'],
      mt5_ticket: deal.id?.toString() ?? null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('trades')
      .upsert(rows, { onConflict: 'mt5_ticket', ignoreDuplicates: true })
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ inserted: data?.length ?? 0, skipped: rows.length - (data?.length ?? 0) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
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
