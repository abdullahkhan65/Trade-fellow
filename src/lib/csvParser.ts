import Papa from 'papaparse';
import { Trade, TradeDirection, TradingStyle } from '@/types';

interface MT5Row {
  [key: string]: string;
}

// MT5 History CSV column names (various export formats)
const COL_ALIASES: Record<string, string[]> = {
  ticket: ['Ticket', 'ticket', 'Order', 'Deal', 'Position'],
  openTime: ['Open Time', 'Time', 'Open time', 'OpenTime', 'open_time', 'Time (open)'],
  symbol: ['Symbol', 'symbol', 'Instrument'],
  type: ['Type', 'type', 'Direction', 'Action'],
  lots: ['Volume', 'Lots', 'Size', 'volume', 'lots'],
  openPrice: ['Open Price', 'Price (open)', 'Entry', 'Open price', 'Price'],
  sl: ['S / L', 'SL', 'Stop Loss', 'S/L', 'StopLoss', 'stop_loss'],
  tp: ['T / P', 'TP', 'Take Profit', 'T/P', 'TakeProfit', 'take_profit'],
  closePrice: ['Close Price', 'Price (close)', 'Exit', 'Close price', 'Close Price'],
  profit: ['Profit', 'P&L', 'Net Profit', 'profit', 'pnl'],
  comment: ['Comment', 'comment', 'Note'],
};

function findCol(row: MT5Row, fieldName: string): string {
  const aliases = COL_ALIASES[fieldName] ?? [];
  for (const alias of aliases) {
    if (alias in row) return row[alias]?.trim() ?? '';
  }
  return '';
}

function detectDirection(type: string): TradeDirection {
  const t = type.toLowerCase();
  if (t.includes('sell') || t.includes('short')) return 'short';
  return 'long';
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  // MT5 format: "2025.01.15 08:30:00" or "2025-01-15 08:30"
  const cleaned = dateStr.replace(/\./g, '-').split(' ')[0];
  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  return new Date().toISOString().slice(0, 10);
}

export interface ParseResult {
  trades: Omit<Trade, 'id' | 'riskAmount' | 'riskPercent' | 'pnl' | 'rMultiple'>[];
  errors: string[];
  total: number;
}

export function parseMT5CSV(csvText: string): ParseResult {
  const result = Papa.parse<MT5Row>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const trades: ParseResult['trades'] = [];
  const errors: string[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    try {
      const ticket = findCol(row, 'ticket');
      const symbol = findCol(row, 'symbol');
      const type = findCol(row, 'type');
      const lotsStr = findCol(row, 'lots');
      const openPriceStr = findCol(row, 'openPrice');
      const slStr = findCol(row, 'sl');
      const tpStr = findCol(row, 'tp');
      const closePriceStr = findCol(row, 'closePrice');
      const profitStr = findCol(row, 'profit');
      const dateStr = findCol(row, 'openTime');
      const comment = findCol(row, 'comment');

      if (!symbol || !lotsStr || !openPriceStr) continue;

      // Skip balance/deposit/withdrawal rows
      if (['balance', 'deposit', 'withdrawal', 'credit'].some((kw) => type.toLowerCase().includes(kw))) continue;

      const lots = parseFloat(lotsStr.replace(',', '.')) || 0;
      const entry = parseFloat(openPriceStr.replace(',', '.')) || 0;
      const sl = parseFloat(slStr.replace(',', '.')) || (entry * (type.toLowerCase().includes('sell') ? 1.002 : 0.998));
      const tp = tpStr ? parseFloat(tpStr.replace(',', '.')) || null : null;
      const exit = closePriceStr ? parseFloat(closePriceStr.replace(',', '.')) || null : null;
      const pnlValue = profitStr ? parseFloat(profitStr.replace(',', '.').replace(/[^0-9.-]/g, '')) : null;
      const direction = detectDirection(type);

      trades.push({
        account_id: 'pending',
        date: parseDate(dateStr),
        symbol: symbol.toUpperCase(),
        direction,
        positionSize: lots,
        entry,
        stopLoss: sl,
        takeProfit: tp,
        exit,
        status: exit !== null ? 'closed' : 'open',
        tradingStyle: 'day' as TradingStyle,
        notes: comment || `Imported from MT5 (Ticket: ${ticket})`,
        tags: ['mt5-import'],
        mt5_ticket: ticket || null,
      });
    } catch (e) {
      errors.push(`Row ${i + 2}: ${String(e)}`);
    }
  }

  return { trades, errors, total: result.data.length };
}
