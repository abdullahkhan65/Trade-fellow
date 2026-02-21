'use client';

import { BookOpen, Target, Shield, BarChart2, Download, Settings, Lightbulb, AlertTriangle } from 'lucide-react';

const sections = [
  {
    id: 'getting-started',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Getting Started',
    content: [
      {
        subtitle: '1. Configure Your Account',
        text: 'Go to Settings and enter your funded account size, max daily loss %, max drawdown %, and profit target. You can use the preset buttons for popular prop firms (FTMO, MyFundedFX, etc.).',
      },
      {
        subtitle: '2. Log Your First Trade',
        text: 'Click "Log Trade" on the Dashboard or Trade Journal page. Enter the date, symbol, direction (long/short), entry price, stop loss, and position size. The app will automatically calculate your risk amount and risk percentage.',
      },
      {
        subtitle: '3. Monitor Risk Live',
        text: 'The Dashboard shows your daily loss tracker, drawdown gauge, and all key performance metrics in real-time. Color-coded alerts warn you when approaching limits.',
      },
    ],
  },
  {
    id: 'trade-input',
    icon: Target,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    title: 'How to Input Trades',
    content: [
      {
        subtitle: 'Required Fields',
        text: 'Date, Symbol, Direction, Entry Price, Stop Loss, and Position Size are required. The app calculates your risk automatically.',
      },
      {
        subtitle: 'Position Size',
        text: 'Enter the size in units, lots, or contracts depending on your instrument. For forex pairs, this is typically units (10,000 = 0.1 lot). For indices and crypto, enter the contract/coin count.',
      },
      {
        subtitle: 'Exit Price & P&L',
        text: 'For closed trades, enter the exit price. P&L and R Multiple are calculated automatically. For open positions, leave Exit Price blank and set Status to "Open".',
      },
      {
        subtitle: 'Live Calculation Preview',
        text: 'As you fill in the form, you\'ll see a real-time preview showing Risk Amount, Risk %, Estimated P&L, and R Multiple. A red warning appears if your risk exceeds your daily limit.',
      },
    ],
  },
  {
    id: 'risk-tracking',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    title: 'How to Track Risk',
    content: [
      {
        subtitle: 'Daily Loss Tracker',
        text: 'Shows how much of your daily loss allowance has been used today. The progress bar turns yellow at 80% and red at 100%. When breached, an alert banner appears at the top.',
      },
      {
        subtitle: 'Current Drawdown',
        text: 'Calculates the percentage drop from your peak balance. This updates in real-time as you close trades. Trailing drawdown mode tracks from your high-water mark (FTMO style).',
      },
      {
        subtitle: 'Max Drawdown',
        text: 'The highest drawdown ever experienced during your trading history. This is displayed alongside your current drawdown for comparison.',
      },
      {
        subtitle: 'Open Positions',
        text: 'Active open trades are shown in the Risk Limits section. You can close them by clicking the green checkmark in the Trade Journal.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    title: 'Understanding Analytics',
    content: [
      {
        subtitle: 'Equity Curve',
        text: 'Shows your account balance over time. An upward-sloping curve indicates consistent profitability. Flat or declining periods represent drawdown phases.',
      },
      {
        subtitle: 'Drawdown Chart',
        text: 'Visualizes your percentage drawdown at each trade. The red dashed line shows your maximum allowed drawdown. Stay below this line to avoid account breach.',
      },
      {
        subtitle: 'P&L Histogram',
        text: 'Shows individual trade results as bars. Green bars are wins, red bars are losses. Ideal patterns show more/taller green bars with shorter red bars.',
      },
      {
        subtitle: 'R Multiple',
        text: 'R is your Risk:Reward ratio. +2R means you made 2x your risked amount. A positive average R multiple (>1) combined with a win rate >40% is generally profitable.',
      },
      {
        subtitle: 'Profit Factor',
        text: 'Gross profits divided by gross losses. >1.5 is considered good. >2.0 is excellent. <1.0 means you\'re losing money overall.',
      },
    ],
  },
  {
    id: 'export',
    icon: Download,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    title: 'Exporting Reports',
    content: [
      {
        subtitle: 'CSV Export',
        text: 'Exports all trades to a .csv file. Open with Excel, Google Sheets, or any spreadsheet app. Includes all trade data: dates, symbols, entry/exit, P&L, risk %, and notes.',
      },
      {
        subtitle: 'PDF Report',
        text: 'Generates a professional PDF report with your performance summary and complete trade log. Perfect for performance reviews, prop firm submissions, or personal records.',
      },
      {
        subtitle: 'Monthly Reports',
        text: 'The PDF includes a month-by-month breakdown. Export at the end of each month to track your progress and review performance trends.',
      },
    ],
  },
  {
    id: 'tips',
    icon: Lightbulb,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    title: 'Pro Trading Tips',
    content: [
      {
        subtitle: 'Risk Per Trade',
        text: 'Most professional prop traders risk 0.5%–2% per trade. Never risk more than your daily limit on a single trade. Consistency beats home runs.',
      },
      {
        subtitle: 'Minimum R:R Ratio',
        text: 'Aim for at least 1:1.5 R:R per trade. With a 50% win rate and 1.5R average, you\'ll be profitable long-term. Better setups = higher R multiples.',
      },
      {
        subtitle: 'Stop Trading When…',
        text: 'You\'ve hit 80% of your daily loss limit, taken 3+ consecutive losses, or feel emotional. Cutting losing days short preserves capital and mental capital.',
      },
      {
        subtitle: 'Journal Religiously',
        text: 'Add detailed notes to every trade — setup, reasoning, what went wrong/right. Reviewing your journal weekly reveals patterns you can\'t see in the moment.',
      },
      {
        subtitle: 'Prop Firm Key Rules',
        text: 'Most prop firms have: (1) Max daily loss (usually 4–5%), (2) Max total drawdown (usually 8–12%), (3) Minimum trading days, (4) Profit target. Know your firm\'s specific rules.',
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white tracking-tight">Trading Guide</h1>
        <p className="text-sm text-gray-500 mt-1">How to use PropTrader + prop firm risk management tips</p>
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-7">
        <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-400 mb-1">Important Disclaimer</p>
          <p className="text-xs text-yellow-300/80">
            This tool is for educational and organizational purposes. Always verify your prop firm&apos;s specific rules before trading.
            Past performance does not guarantee future results. Trading involves substantial risk of loss.
          </p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 mb-7">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="px-3 py-1.5 bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
          >
            {s.title}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              id={section.id}
              className={`bg-[#0d1117] border rounded-xl p-6 ${section.border}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <h2 className="text-base font-semibold text-white">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.content.map((item) => (
                  <div key={item.subtitle}>
                    <p className="text-sm font-semibold text-gray-200 mb-1">{item.subtitle}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard shortcuts */}
      <div className="mt-5 bg-[#0d1117] border border-[#2a2f3e] rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Keyboard Shortcuts & Tips</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'Dashboard → Log Trade', desc: 'Open the trade entry form' },
            { key: 'Trade Journal → Filter', desc: 'Search by symbol, notes or tags' },
            { key: 'Trade Journal → ✓ Button', desc: 'Close an open position at exit price' },
            { key: 'Settings → Presets', desc: 'Auto-fill rules for popular prop firms' },
            { key: 'Export CSV', desc: 'Download trades for Excel analysis' },
            { key: 'Export PDF', desc: 'Generate professional performance report' },
          ].map((shortcut) => (
            <div key={shortcut.key} className="flex items-start gap-3 p-3 bg-[#1a1f2e] rounded-lg">
              <code className="text-xs bg-[#0d1117] text-blue-400 px-2 py-1 rounded font-mono shrink-0">{shortcut.key}</code>
              <p className="text-xs text-gray-400">{shortcut.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
