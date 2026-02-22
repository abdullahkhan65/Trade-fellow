import Papa from 'papaparse';
import { Trade, TradeDirection, TradingStyle } from '@/types';

interface MT5Row {
  [key: string]: string;
}

// MT5 History CSV column names (various export formats)
const COL_ALIASES: Record<string, string[]> = {
  ticket:     ['Ticket', 'ticket', 'Order', 'Deal', 'Position'],
  openTime:   ['Open Time', 'Time', 'Open time', 'OpenTime', 'open_time', 'Time (open)'],
  // "Item" is used in some MT5 CSV exports instead of "Symbol"
  symbol:     ['Symbol', 'symbol', 'Instrument', 'Item', 'item'],
  type:       ['Type', 'type', 'Direction', 'Action'],
  lots:       ['Volume', 'Lots', 'Size', 'volume', 'lots'],
  openPrice:  ['Open Price', 'Price (open)', 'Entry', 'Open price', 'Price'],
  sl:         ['S / L', 'SL', 'Stop Loss', 'S/L', 'StopLoss', 'stop_loss'],
  tp:         ['T / P', 'TP', 'Take Profit', 'T/P', 'TakeProfit', 'take_profit'],
  // "Price_1" is how PapaParse names the second "Price" column when there are duplicates
  closePrice: ['Close Price', 'Price (close)', 'Exit', 'Close price', 'Price_1', 'Price 1'],
  profit:     ['Profit', 'P&L', 'Net Profit', 'profit', 'pnl'],
  commission: ['Commission', 'commission', 'Comm'],
  swap:       ['Swap', 'swap'],
  comment:    ['Comment', 'comment', 'Note'],
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

function parseNum(str: string): number | null {
  if (!str) return null;
  const n = parseFloat(str.replace(',', '.').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

export interface ParseResult {
  // pnl is included so actual MT5 profit (with commission/swap) flows through
  trades: Omit<Trade, 'id' | 'riskAmount' | 'riskPercent' | 'rMultiple'>[];
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
      const ticket     = findCol(row, 'ticket');
      const symbol     = findCol(row, 'symbol');
      const type       = findCol(row, 'type');
      const lotsStr    = findCol(row, 'lots');
      const openPriceStr  = findCol(row, 'openPrice');
      const slStr      = findCol(row, 'sl');
      const tpStr      = findCol(row, 'tp');
      const closePriceStr = findCol(row, 'closePrice');
      const profitStr  = findCol(row, 'profit');
      const commissionStr = findCol(row, 'commission');
      const swapStr    = findCol(row, 'swap');
      const dateStr    = findCol(row, 'openTime');
      const comment    = findCol(row, 'comment');

      if (!symbol || !lotsStr || !openPriceStr) continue;

      // Skip balance/deposit/withdrawal rows
      if (['balance', 'deposit', 'withdrawal', 'credit'].some((kw) => type.toLowerCase().includes(kw))) continue;

      const lots      = parseFloat(lotsStr.replace(',', '.')) || 0;
      const entry     = parseFloat(openPriceStr.replace(',', '.')) || 0;
      const sl        = parseNum(slStr) ?? (entry * (type.toLowerCase().includes('sell') ? 1.002 : 0.998));
      const tp        = parseNum(tpStr);
      const exit      = parseNum(closePriceStr);
      const direction = detectDirection(type);

      // Use the actual MT5 net profit (including commission + swap) for accuracy
      const rawProfit    = parseNum(profitStr);
      const commission   = parseNum(commissionStr) ?? 0;
      const swap         = parseNum(swapStr) ?? 0;
      const netPnl: number | null = rawProfit !== null ? rawProfit + commission + swap : null;

      trades.push({
        account_id:    'pending',
        date:          parseDate(dateStr),
        symbol:        symbol.toUpperCase(),
        direction,
        positionSize:  lots,
        entry,
        stopLoss:      sl,
        takeProfit:    tp,
        exit,
        pnl:           netPnl,
        status:        exit !== null ? 'closed' : 'open',
        tradingStyle:  'day' as TradingStyle,
        notes:         comment || `Imported from MT5 (Ticket: ${ticket})`,
        tags:          ['mt5-import'],
        mt5_ticket:    ticket || null,
      });
    } catch (e) {
      errors.push(`Row ${i + 2}: ${String(e)}`);
    }
  }

  return { trades, errors, total: result.data.length };
}
