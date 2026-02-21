'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Building2 } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { useTradeStore } from '@/store/useTradeStore';
import clsx from 'clsx';

const accountTypeColors: Record<string, string> = {
  challenge: 'text-yellow-400 bg-yellow-500/10',
  funded: 'text-green-400 bg-green-500/10',
  personal: 'text-blue-400 bg-blue-500/10',
};

export default function AccountSwitcher() {
  const { accounts, activeAccountId, activeAccount, setActiveAccount, fetchAccounts, createAccount } = useAccountStore();
  const { fetchTrades } = useTradeStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('100000');
  const [newType, setNewType] = useState<'challenge' | 'funded' | 'personal'>('funded');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (activeAccountId) fetchTrades(activeAccountId);
  }, [activeAccountId, fetchTrades]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSwitch = (id: string) => {
    setActiveAccount(id);
    setOpen(false);
  };

  const handleCreate = async () => {
    if (!newName || !newBalance) return;
    setCreating(true);
    await createAccount({
      name: newName,
      broker: null,
      account_number: null,
      account_type: newType,
      starting_balance: parseFloat(newBalance),
      currency: 'USD',
      max_daily_risk_percent: 5,
      max_drawdown_percent: 10,
      profit_target_percent: 10,
      trading_style: 'day',
      trailing_drawdown: false,
      metaapi_account_id: null,
      metaapi_token: null,
      is_active: true,
    });
    setCreating(false);
    setShowCreate(false);
    setNewName('');
    setNewBalance('100000');
  };

  if (!activeAccount && accounts.length === 0) {
    return (
      <button
        onClick={() => { setOpen(true); setShowCreate(true); }}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:bg-blue-600/30 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Create Account
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] rounded-lg transition-colors max-w-[180px]"
      >
        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-medium text-white truncate">{activeAccount?.name ?? 'Select Account'}</p>
          {activeAccount && (
            <p className="text-xs text-gray-500 capitalize">{activeAccount.account_type}</p>
          )}
        </div>
        <ChevronDown className={clsx('w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-64 bg-[#0d1117] border border-[#2a2f3e] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Account list */}
          <div className="p-2 max-h-56 overflow-y-auto">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => handleSwitch(acc.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1f2e] transition-colors text-left"
              >
                <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', accountTypeColors[acc.account_type] ?? 'text-gray-400 bg-gray-500/10')}>
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{acc.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{acc.account_type} · ${(acc.starting_balance / 1000).toFixed(0)}k</p>
                </div>
                {acc.id === activeAccountId && <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              </button>
            ))}
            {accounts.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-3">No accounts yet</p>
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-[#2a2f3e] p-2">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-sm text-gray-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Account
              </button>
            ) : (
              <div className="p-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Account name"
                  className="w-full bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="Balance"
                    className="flex-1 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as typeof newType)}
                    className="bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="funded">Funded</option>
                    <option value="challenge">Challenge</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-1.5 rounded-lg bg-[#1a1f2e] border border-[#2a2f3e] text-xs text-gray-400">Cancel</button>
                  <button
                    onClick={handleCreate}
                    disabled={!newName || creating}
                    className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs text-white font-medium transition-colors"
                  >
                    {creating ? '...' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
