import { Trade, Settings, DashboardMetrics } from '@/types';
import { formatCurrency, formatPercent } from './calculations';
import { format, parseISO } from 'date-fns';

// CSV Export
export function exportToCSV(trades: Trade[], settings: Settings): void {
  const headers = [
    'Date', 'Symbol', 'Direction', 'Style', 'Status',
    'Entry', 'Stop Loss', 'Take Profit', 'Exit',
    'Position Size', 'Risk Amount', 'Risk %', 'P&L', 'R Multiple',
    'Notes', 'Tags'
  ];

  const rows = trades.map((t) => [
    t.date,
    t.symbol,
    t.direction,
    t.tradingStyle,
    t.status,
    t.entry,
    t.stopLoss,
    t.takeProfit ?? '',
    t.exit ?? '',
    t.positionSize,
    t.riskAmount.toFixed(2),
    t.riskPercent.toFixed(2) + '%',
    t.pnl !== null ? t.pnl.toFixed(2) : '',
    t.rMultiple !== null ? t.rMultiple.toFixed(2) : '',
    `"${t.notes.replace(/"/g, '""')}"`,
    `"${t.tags.join(', ')}"`,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  downloadFile(csv, 'trade-journal.csv', 'text/csv');
}

// PDF Export
export async function exportToPDF(
  trades: Trade[],
  settings: Settings,
  metrics: DashboardMetrics
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const today = format(new Date(), 'MMMM dd, yyyy');

  // ── Header ──────────────────────────────────────────────────
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TRADEFELLOW', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Risk Calculator & Trade Journal Report', 15, 23);
  doc.text(`Generated: ${today}`, 15, 29);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Account: ${formatCurrency(settings.startingBalance, settings.currency)}`, pageW - 15, 16, { align: 'right' });
  doc.text(`Balance: ${formatCurrency(metrics.currentBalance, settings.currency)}`, pageW - 15, 23, { align: 'right' });
  doc.text(`Total P&L: ${formatCurrency(metrics.totalPnL, settings.currency)}`, pageW - 15, 29, { align: 'right' });

  // ── Performance Summary ──────────────────────────────────────
  let y = 42;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Performance Summary', 15, y);
  y += 6;

  const summaryData = [
    ['Total P&L', formatCurrency(metrics.totalPnL, settings.currency), 'Win Rate', `${metrics.winRate.toFixed(1)}%`],
    ['Total Trades', metrics.totalTrades.toString(), 'Profit Factor', isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞'],
    ['Total Wins', metrics.totalWins.toString(), 'Avg R Multiple', `${metrics.avgRMultiple.toFixed(2)}R`],
    ['Total Losses', metrics.totalLosses.toString(), 'Max Drawdown', `${metrics.maxDrawdown.toFixed(2)}%`],
    ['Avg Win', formatCurrency(metrics.averageWin, settings.currency), 'Avg Loss', formatCurrency(metrics.averageLoss, settings.currency)],
    ['Largest Win', formatCurrency(metrics.largestWin, settings.currency), 'Largest Loss', formatCurrency(metrics.largestLoss, settings.currency)],
    ['Daily Loss Limit', formatCurrency(metrics.dailyLossLimit, settings.currency), 'Current Drawdown', `${metrics.currentDrawdown.toFixed(2)}%`],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3, textColor: [200, 200, 200] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 45 },
      1: { textColor: [255, 255, 255], cellWidth: 55 },
      2: { fontStyle: 'bold', textColor: [107, 114, 128], cellWidth: 45 },
      3: { textColor: [255, 255, 255], cellWidth: 55 },
    },
    tableLineColor: [42, 47, 62],
    tableLineWidth: 0.1,
  });

  // ── Trade Log ──────────────────────────────────────────────
  const afterSummary = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100;
  y = afterSummary + 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Trade Log', 15, y);
  y += 4;

  const closedTrades = trades
    .filter((t) => t.status === 'closed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Symbol', 'Dir', 'Style', 'Entry', 'Exit', 'Risk %', 'P&L', 'R', 'Notes']],
    body: closedTrades.map((t) => [
      t.date,
      t.symbol,
      t.direction.toUpperCase(),
      t.tradingStyle,
      t.entry.toFixed(4),
      t.exit?.toFixed(4) ?? '—',
      `${t.riskPercent.toFixed(2)}%`,
      t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—',
      t.rMultiple !== null ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R` : '—',
      t.notes.slice(0, 40) + (t.notes.length > 40 ? '...' : ''),
    ]),
    theme: 'plain',
    headStyles: {
      fillColor: [26, 31, 46],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [200, 200, 200] },
    alternateRowStyles: { fillColor: [15, 20, 30] },
    tableLineColor: [42, 47, 62],
    tableLineWidth: 0.1,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = data.cell.raw as string;
        if (val.startsWith('+')) data.cell.styles.textColor = [34, 197, 94];
        else if (val.startsWith('-')) data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // ── Footer ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Page ${i} of ${pageCount} — TradeFellow Risk Calculator`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`trade-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
