'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { computeMetrics } from '@/lib/calculations';
import { exportToCSV, exportToPDF } from '@/lib/export';

export default function ExportButtons() {
  const { trades, settings } = useTradeStore();
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCSV = () => {
    exportToCSV(trades, settings);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const metrics = computeMetrics(trades, settings);
      await exportToPDF(trades, settings, metrics);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] rounded-lg text-sm text-gray-300 transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4 text-green-400" />
        Export CSV
      </button>
      <button
        onClick={handlePDF}
        disabled={pdfLoading}
        className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] hover:bg-[#2a2f3e] border border-[#2a2f3e] rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50"
      >
        {pdfLoading ? (
          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileText className="w-4 h-4 text-red-400" />
        )}
        Export PDF
      </button>
    </div>
  );
}
