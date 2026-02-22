import Papa from 'papaparse';
import { Trade, TradeDirection, TradingStyle } from '@/types';

interface MT5Row {
  [key: string]: string | undefined;
}

// MT5 History CSV column names (various export formats)
const COL_ALIASES: Record<string, string[]> = {
  ticket:     ['Ticket', 'ticket', 'Order', 'Deal', 'Position'],
  openTime:   ['Open Time', 'Time', 'Open time', 'OpenTime', 'open_time', 'Time (open)'],
  closeTime:  ['Close Time', 'Time (close)', 'Close time', 'close_time'],
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

const NORMALIZED_ALIASES = Object.fromEntries(
  Object.entries(COL_ALIASES).map(([field, aliases]) => [field, aliases.map(normalizeKey)])
) as Record<string, string[]>;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\uFEFF/g, '').replace(/[^a-z0-9]/g, '');
}

function buildRowLookup(row: MT5Row): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    map.set(normalizeKey(key), (value ?? '').toString().trim());
  }
  return map;
}

function findCol(rowLookup: Map<string, string>, fieldName: string): string {
  const aliases = NORMALIZED_ALIASES[fieldName] ?? [];
  for (const alias of aliases) {
    const value = rowLookup.get(alias);
    if (value) return value;
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
  // MT5 formats commonly seen:
  // - "2025.01.15 08:30:00"
  // - "2025-01-15 08:30"
  // - "15.01.2025 08:30"
  const base = dateStr.trim().replace(/\./g, '-');
  const cleaned = base.split(' ')[0];

  const ymd = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dmy = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch { /* ignore */ }
  return new Date().toISOString().slice(0, 10);
}

function parseNum(str: string): number | null {
  if (!str) return null;
  const raw = str.trim().replace(/\s+/g, '');
  if (!raw) return null;

  const cleaned = raw.replace(/[^0-9,.-]/g, '');
  if (!cleaned) return null;

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;

  let normalized = cleaned;
  if (commaCount > 0 && dotCount > 0) {
    // Decide decimal separator by whichever appears last.
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (commaCount > 0 && dotCount === 0) {
    normalized = cleaned.replace(',', '.');
  }

  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

function detectDelimiter(text: string): string {
  const firstLine = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? '';

  const candidates = [',', ';', '\t'];
  let best = ',';
  let bestCount = -1;
  for (const c of candidates) {
    const count = (firstLine.match(new RegExp(`\\${c}`, 'g')) ?? []).length;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

function decodeHtmlEntities(input: string): string {
  const named = input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return named.replace(/&#(\d+);/g, (_, num) => {
    const code = Number(num);
    return Number.isFinite(code) ? String.fromCharCode(code) : '';
  });
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function escapeCSVCell(value: string): string {
  if (/["\n,;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function tableToCSV(tableHtml: string): string {
  const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const rows: string[][] = [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? [];
    if (cellMatches.length === 0) continue;
    const cells = cellMatches.map((cell) => stripHtml(cell));
    rows.push(cells);
  }

  return rows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => row.map(escapeCSVCell).join(','))
    .join('\n');
}

function normalizeInput(rawInput: string): string {
  const text = rawInput.replace(/^\uFEFF/, '').trim();
  if (!/<table[\s\S]*?>/i.test(text)) return text;

  const tables = text.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  if (tables.length === 0) return text;

  let bestTable = tables[0] ?? '';
  let bestScore = -1;
  for (const table of tables) {
    const plain = stripHtml(table).toLowerCase();
    const headerSignals = ['symbol', 'item', 'ticket', 'type', 'volume', 'profit'];
    const headerScore = headerSignals.reduce((s, key) => s + (plain.includes(key) ? 1 : 0), 0);
    const rowScore = (table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).length;
    const score = headerScore * 100 + rowScore;
    if (score > bestScore) {
      bestTable = table;
      bestScore = score;
    }
  }

  const csvFromTable = tableToCSV(bestTable);
  return csvFromTable || text;
}

export interface ParseResult {
  // pnl is included so actual MT5 profit (with commission/swap) flows through
  trades: Omit<Trade, 'id' | 'riskAmount' | 'riskPercent' | 'rMultiple'>[];
  errors: string[];
  total: number;
}

export function parseMT5CSV(csvText: string): ParseResult {
  const normalizedInput = normalizeInput(csvText);
  const result = Papa.parse<MT5Row>(normalizedInput, {
    header: true,
    skipEmptyLines: true,
    delimiter: detectDelimiter(normalizedInput),
    transformHeader: (h) => h.trim(),
  });

  const trades: ParseResult['trades'] = [];
  const errors: string[] = result.errors.map((err) => `Line ${err.row ?? 'unknown'}: ${err.message}`);

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    try {
      const rowLookup = buildRowLookup(row);
      const ticket     = findCol(rowLookup, 'ticket');
      const symbol     = findCol(rowLookup, 'symbol');
      const type       = findCol(rowLookup, 'type');
      const lotsStr    = findCol(rowLookup, 'lots');
      const openPriceStr  = findCol(rowLookup, 'openPrice');
      const slStr      = findCol(rowLookup, 'sl');
      const tpStr      = findCol(rowLookup, 'tp');
      const closePriceStr = findCol(rowLookup, 'closePrice');
      const profitStr  = findCol(rowLookup, 'profit');
      const commissionStr = findCol(rowLookup, 'commission');
      const swapStr    = findCol(rowLookup, 'swap');
      const openDateStr = findCol(rowLookup, 'openTime');
      const closeDateStr = findCol(rowLookup, 'closeTime');
      const dateStr    = openDateStr || closeDateStr;
      const comment    = findCol(rowLookup, 'comment');

      if (!symbol || !lotsStr || !openPriceStr) continue;

      // Skip balance/deposit/withdrawal rows
      if (['balance', 'deposit', 'withdrawal', 'credit'].some((kw) => type.toLowerCase().includes(kw))) continue;

      const lots      = parseNum(lotsStr) ?? 0;
      const entry     = parseNum(openPriceStr) ?? 0;
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
        notes:         comment || (ticket ? `Imported from MT5 (Ticket: ${ticket})` : 'Imported from MT5'),
        tags:          ['mt5-import'],
        mt5_ticket:    ticket || null,
      });
    } catch (e) {
      errors.push(`Row ${i + 2}: ${String(e)}`);
    }
  }

  return { trades, errors, total: result.data.length };
}
