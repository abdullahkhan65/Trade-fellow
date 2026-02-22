'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Plug, CheckCircle, AlertCircle, FileText, RefreshCw, Eye, EyeOff, Info } from 'lucide-react';
import { parseMT5CSV, ParseResult } from '@/lib/csvParser';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountStore } from '@/store/useAccountStore';
import clsx from 'clsx';

type Tab = 'csv' | 'metaapi';

export default function MT5Page() {
  const [tab, setTab] = useState<Tab>('csv');
  const [dragging, setDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // MetaApi state
  const [maToken, setMaToken] = useState('');
  const [maAccountId, setMaAccountId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const { bulkInsertTrades } = useTradeStore();
  const { activeAccountId, activeAccount, updateAccount } = useAccountStore();

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setParseResult({ trades: [], errors: ['File is too large. Maximum size is 10 MB.'], total: 0 });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseMT5CSV(text);
      setParseResult(result);
      setImportResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.htm') || file.name.endsWith('.html'))) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = async () => {
    if (!parseResult || !activeAccountId) return;
    setImporting(true);
    const result = await bulkInsertTrades(
      parseResult.trades.map((t) => ({ ...t, account_id: activeAccountId })),
      activeAccountId
    );
    setImportResult(result);
    setImporting(false);
  };

  const handleMetaApiSync = async () => {
    if (!maToken || !maAccountId || !activeAccountId) return;
    setSyncing(true);
    setSyncResult(null);

    try {
      // Save MetaApi credentials to account
      await updateAccount(activeAccountId, {
        metaapi_token: maToken,
        metaapi_account_id: maAccountId,
      });

      // Call our API route for MetaApi sync
      const res = await fetch('/api/mt5/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: maToken, accountId: maAccountId, propAccountId: activeAccountId }),
      });

      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✓ Synced! ${data.inserted} new trades imported, ${data.skipped} already exist.`);
      } else {
        setSyncResult(`✗ Error: ${data.error}`);
      }
    } catch (e) {
      setSyncResult(`✗ Failed to connect to MetaApi. Check your token and account ID.`);
    }

    setSyncing(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">MT5 Integration</h1>
        <p className="text-sm text-gray-500 mt-1">Import trades from MetaTrader 5 via CSV or real-time MetaApi sync</p>
      </div>

      {!activeAccountId && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-400">Create and select an account first before importing trades.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['csv', 'CSV Import', FileText], ['metaapi', 'MetaApi Real-Time', Plug]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
              tab === id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#0d1117] border-[#2a2f3e] text-gray-400 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* CSV Import Tab */}
      {tab === 'csv' && (
        <div className="space-y-5">
          {/* Instructions */}
          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">How to export from MT5</p>
            </div>
            <ol className="space-y-1.5 text-sm text-gray-400 list-decimal list-inside">
              <li>Open MetaTrader 5 terminal</li>
              <li>Go to <strong className="text-white">View → Terminal</strong> (or press Ctrl+T)</li>
              <li>Click the <strong className="text-white">Account History</strong> tab</li>
              <li>Right-click → <strong className="text-white">Save as Report</strong> → select <strong className="text-white">CSV (comma separated)</strong></li>
              <li>Upload the CSV file below</li>
            </ol>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
              dragging ? 'border-blue-500 bg-blue-500/10' : 'border-[#2a2f3e] hover:border-[#3a3f4e] bg-[#0d1117]'
            )}
          >
            <Upload className={clsx('w-10 h-10 mx-auto mb-3', dragging ? 'text-blue-400' : 'text-gray-600')} />
            <p className="text-sm font-medium text-white mb-1">
              {dragging ? 'Drop your MT5 CSV here' : 'Drag & drop your MT5 CSV file'}
            </p>
            <p className="text-xs text-gray-500">or click to browse — .csv files accepted</p>
            <input ref={fileRef} type="file" accept=".csv,.htm,.html" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          {/* Parse Preview */}
          {parseResult && (
            <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2f3e]">
                <div>
                  <p className="text-sm font-semibold text-white">Preview — {parseResult.trades.length} trades detected</p>
                  <p className="text-xs text-gray-500 mt-0.5">{parseResult.errors.length} parse errors • {parseResult.total} total rows</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setParseResult(null); setImportResult(null); }}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-xs text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || !activeAccountId || parseResult.trades.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs text-white font-medium transition-colors"
                  >
                    {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {importing ? 'Importing...' : `Import ${parseResult.trades.length} Trades`}
                  </button>
                </div>
              </div>

              {importResult && (
                <div className={clsx('px-5 py-3 border-b border-[#2a2f3e] flex items-center gap-2 text-sm', importResult.inserted > 0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400')}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {importResult.inserted} trades imported, {importResult.skipped} duplicates skipped.
                </div>
              )}

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="border-b border-[#2a2f3e]">
                    <tr className="text-left text-gray-500">
                      {['Date', 'Symbol', 'Dir', 'Lots', 'Entry', 'Exit', 'P&L', 'Status', 'MT5 Ticket'].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1f2e]">
                    {parseResult.trades.slice(0, 20).map((t, i) => (
                      <tr key={i} className="hover:bg-[#1a1f2e]/50">
                        <td className="px-3 py-2 text-gray-400">{t.date}</td>
                        <td className="px-3 py-2 font-medium text-white">{t.symbol}</td>
                        <td className="px-3 py-2">
                          <span className={t.direction === 'long' ? 'text-green-400' : 'text-red-400'}>{t.direction === 'long' ? '↑ L' : '↓ S'}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-300">{t.positionSize}</td>
                        <td className="px-3 py-2 font-mono text-gray-300">{t.entry}</td>
                        <td className="px-3 py-2 font-mono text-gray-300">{t.exit ?? '—'}</td>
                        <td className="px-3 py-2">—</td>
                        <td className="px-3 py-2">
                          <span className={clsx('px-1.5 py-0.5 rounded text-xs', t.status === 'open' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400')}>{t.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 font-mono">{t.mt5_ticket ?? '—'}</td>
                      </tr>
                    ))}
                    {parseResult.trades.length > 20 && (
                      <tr><td colSpan={9} className="px-3 py-2 text-center text-gray-600">... and {parseResult.trades.length - 20} more</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MetaApi Tab */}
      {tab === 'metaapi' && (
        <div className="space-y-5">
          <div className="bg-[#0d1117] border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-white">How to get your MetaApi credentials</p>
            </div>
            <ol className="space-y-1.5 text-sm text-gray-400 list-decimal list-inside">
              <li>Create a free account at <span className="text-blue-400">app.metaapi.cloud</span></li>
              <li>Add your MT5 account under <strong className="text-white">Accounts</strong></li>
              <li>Copy your <strong className="text-white">API Token</strong> from the top-right profile menu</li>
              <li>Copy your <strong className="text-white">Account ID</strong> from the Accounts page</li>
              <li>Enter them below and click Sync</li>
            </ol>
          </div>

          <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-white">MetaApi Connection</p>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">MetaApi Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={maToken}
                  onChange={(e) => setMaToken(e.target.value)}
                  placeholder="eyJ0eXAiO..."
                  className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">MT5 Account ID (from MetaApi)</label>
              <input
                type="text"
                value={maAccountId}
                onChange={(e) => setMaAccountId(e.target.value)}
                placeholder="12345678-abcd-..."
                className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {syncResult && (
              <div className={clsx('flex items-center gap-2 p-3 rounded-xl text-sm', syncResult.startsWith('✓') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400')}>
                {syncResult.startsWith('✓') ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {syncResult}
              </div>
            )}

            <button
              onClick={handleMetaApiSync}
              disabled={!maToken || !maAccountId || !activeAccountId || syncing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
              {syncing ? 'Syncing from MT5...' : 'Sync Trades from MT5'}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Your MetaApi credentials are stored securely in your account settings and never shared.
            </p>
          </div>

          {/* Last sync info */}
          {activeAccount?.metaapi_account_id && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">MetaApi Connected</p>
                <p className="text-xs text-green-300/70 mt-0.5">Account ID: {activeAccount.metaapi_account_id}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
