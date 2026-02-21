'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Plus, Trash2, Building2, X } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import { Account, AccountType, TradingStyle } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import clsx from 'clsx';

const propFirmPresets = [
  { name: 'FTMO Standard', balance: 100000, daily: 5, drawdown: 10, target: 10 },
  { name: 'FTMO Aggressive', balance: 100000, daily: 5, drawdown: 10, target: 20 },
  { name: 'MyFundedFX', balance: 100000, daily: 4, drawdown: 8, target: 8 },
  { name: 'TFT Aggressive', balance: 100000, daily: 5, drawdown: 12, target: 12 },
  { name: 'E8 Funding', balance: 100000, daily: 5, drawdown: 8, target: 8 },
  { name: 'Apex Trader', balance: 100000, daily: 3, drawdown: 6, target: 9 },
];

const accountTypeBadge: Record<string, string> = {
  challenge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  funded: 'bg-green-500/10 text-green-400 border-green-500/20',
  personal: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function SettingsPage() {
  const { accounts, activeAccountId, activeAccount, fetchAccounts, createAccount, updateAccount, deleteAccount, setActiveAccount } = useAccountStore();
  const { updateSettings } = useTradeStore();
  const [saved, setSaved] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<Partial<Account>>({});
  const [newForm, setNewForm] = useState<Partial<Account>>({
    name: '', broker: '', account_number: '', account_type: 'funded',
    starting_balance: 100000, currency: 'USD', max_daily_risk_percent: 5,
    max_drawdown_percent: 10, profit_target_percent: 10, trading_style: 'day', trailing_drawdown: false,
  });

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { if (activeAccount) setForm({ ...activeAccount }); }, [activeAccount]);

  const handleSave = async () => {
    if (!activeAccountId || !form) return;
    await updateAccount(activeAccountId, form);
    updateSettings({
      startingBalance: form.starting_balance ?? 100000,
      accountSize: form.starting_balance ?? 100000,
      maxDailyRiskPercent: form.max_daily_risk_percent ?? 5,
      maxDrawdownPercent: form.max_drawdown_percent ?? 10,
      profitTargetPercent: form.profit_target_percent ?? 10,
      tradingStyle: (form.trading_style as TradingStyle) ?? 'day',
      currency: form.currency ?? 'USD',
      trailingDrawdown: form.trailing_drawdown ?? false,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCreate = async () => {
    if (!newForm.name) return;
    await createAccount({
      name: newForm.name ?? '', broker: newForm.broker ?? null,
      account_number: newForm.account_number ?? null,
      account_type: (newForm.account_type as AccountType) ?? 'funded',
      starting_balance: newForm.starting_balance ?? 100000,
      currency: newForm.currency ?? 'USD',
      max_daily_risk_percent: newForm.max_daily_risk_percent ?? 5,
      max_drawdown_percent: newForm.max_drawdown_percent ?? 10,
      profit_target_percent: newForm.profit_target_percent ?? 10,
      trading_style: (newForm.trading_style as TradingStyle) ?? 'day',
      trailing_drawdown: newForm.trailing_drawdown ?? false,
      metaapi_account_id: null, metaapi_token: null, is_active: true,
    });
    setShowNewForm(false);
  };

  const applyPreset = (preset: typeof propFirmPresets[0], target: 'form' | 'new') => {
    const update = { starting_balance: preset.balance, max_daily_risk_percent: preset.daily, max_drawdown_percent: preset.drawdown, profit_target_percent: preset.target };
    if (target === 'form') setForm((f) => ({ ...f, ...update }));
    else setNewForm((f) => ({ ...f, ...update }));
  };

  const inputClass = 'w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors';

  const FormFields = ({ data, onChange, onPreset }: { data: Partial<Account>; onChange: (d: Partial<Account>) => void; onPreset: (p: typeof propFirmPresets[0]) => void }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Name *</label>
          <input type="text" value={data.name ?? ''} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="FTMO 100k Funded" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Prop Firm / Broker</label>
          <input type="text" value={data.broker ?? ''} onChange={(e) => onChange({ ...data, broker: e.target.value })} placeholder="FTMO" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Number</label>
          <input type="text" value={data.account_number ?? ''} onChange={(e) => onChange({ ...data, account_number: e.target.value })} placeholder="12345678" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Account Type</label>
          <select value={data.account_type ?? 'funded'} onChange={(e) => onChange({ ...data, account_type: e.target.value as AccountType })} className={inputClass}>
            <option value="challenge">Challenge / Evaluation</option>
            <option value="funded">Funded Account</option>
            <option value="personal">Personal Account</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Starting Balance</label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={data.starting_balance ?? 100000} onChange={(e) => onChange({ ...data, starting_balance: parseFloat(e.target.value) || 0 })} className={`${inputClass} pl-7`} step="1000" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Currency</label>
          <select value={data.currency ?? 'USD'} onChange={(e) => onChange({ ...data, currency: e.target.value })} className={inputClass}>
            {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Daily Loss %</label>
          <div className="relative">
            <input type="number" value={data.max_daily_risk_percent ?? 5} onChange={(e) => onChange({ ...data, max_daily_risk_percent: parseFloat(e.target.value) })} className={`${inputClass} pr-8`} step="0.5" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">= ${((data.max_daily_risk_percent ?? 5) / 100 * (data.starting_balance ?? 100000)).toFixed(0)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Max Drawdown %</label>
          <div className="relative">
            <input type="number" value={data.max_drawdown_percent ?? 10} onChange={(e) => onChange({ ...data, max_drawdown_percent: parseFloat(e.target.value) })} className={`${inputClass} pr-8`} step="0.5" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Profit Target %</label>
          <div className="relative">
            <input type="number" value={data.profit_target_percent ?? 10} onChange={(e) => onChange({ ...data, profit_target_percent: parseFloat(e.target.value) })} className={`${inputClass} pr-8`} step="0.5" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Trading Style</label>
          <select value={data.trading_style ?? 'day'} onChange={(e) => onChange({ ...data, trading_style: e.target.value as TradingStyle })} className={inputClass}>
            <option value="scalping">Scalping</option>
            <option value="day">Day Trading</option>
            <option value="swing">Swing Trading</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange({ ...data, trailing_drawdown: !data.trailing_drawdown })} className={clsx('relative w-11 h-6 rounded-full border transition-all', data.trailing_drawdown ? 'bg-blue-600 border-blue-500' : 'bg-[#1a1f2e] border-[#2a2f3e]')}>
          <span className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', data.trailing_drawdown ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
        <div>
          <p className="text-sm text-gray-300">Trailing Drawdown (FTMO style)</p>
          <p className="text-xs text-gray-600">Track drawdown from account peak</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Prop Firm Quick Presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {propFirmPresets.map((p) => (
            <button key={p.name} type="button" onClick={() => onPreset(p)} className="p-2.5 bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] rounded-xl text-left transition-colors">
              <p className="text-xs font-semibold text-white">{p.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{p.daily}% daily / {p.drawdown}% DD</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage accounts and risk parameters</p>
      </div>

      {/* Accounts */}
      <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2f3e]">
          <h3 className="text-sm font-semibold text-white">Trading Accounts ({accounts.length})</h3>
          <button onClick={() => setShowNewForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs text-blue-400 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>
        <div className="divide-y divide-[#1a1f2e]">
          {accounts.length === 0 && <p className="px-5 py-6 text-sm text-gray-600 text-center">No accounts yet. Add your first account.</p>}
          {accounts.map((acc) => (
            <div key={acc.id} className={clsx('flex items-center gap-4 px-5 py-4', acc.id === activeAccountId && 'bg-blue-500/5')}>
              <div className="w-9 h-9 rounded-xl bg-[#1a1f2e] border border-[#2a2f3e] flex items-center justify-center text-sm font-bold text-white shrink-0">{acc.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{acc.name}</p>
                  <span className={clsx('px-1.5 py-0.5 rounded text-xs border', accountTypeBadge[acc.account_type] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20')}>{acc.account_type}</span>
                  {acc.id === activeAccountId && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">Active</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(acc.starting_balance, acc.currency)} · {acc.max_daily_risk_percent}% daily · {acc.max_drawdown_percent}% DD{acc.broker ? ` · ${acc.broker}` : ''}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {acc.id !== activeAccountId && <button onClick={() => setActiveAccount(acc.id)} className="px-2.5 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-xs text-gray-400 hover:text-white">Switch</button>}
                <button onClick={() => deleteAccount(acc.id)} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Account Form */}
      {showNewForm && (
        <div className="bg-[#0d1117] border border-blue-500/20 rounded-xl mb-5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">New Account</h3>
            <button onClick={() => setShowNewForm(false)} className="w-7 h-7 rounded-lg bg-[#1a1f2e] flex items-center justify-center"><X className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
          <FormFields data={newForm} onChange={setNewForm} onPreset={(p) => applyPreset(p, 'new')} />
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowNewForm(false)} className="flex-1 py-2.5 rounded-xl bg-[#1a1f2e] border border-[#2a2f3e] text-sm text-gray-400">Cancel</button>
            <button onClick={handleCreate} disabled={!newForm.name} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm text-white font-medium">Create Account</button>
          </div>
        </div>
      )}

      {/* Edit Active Account */}
      {activeAccount && (
        <div className="bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Edit: {activeAccount.name}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...activeAccount })} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-xs text-gray-400">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <button onClick={handleSave} className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
                <Save className="w-3 h-3" /> {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
          <FormFields data={form} onChange={setForm} onPreset={(p) => applyPreset(p, 'form')} />
        </div>
      )}
    </div>
  );
}
