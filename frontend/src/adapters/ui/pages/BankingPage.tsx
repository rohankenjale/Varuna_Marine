import { useState } from 'react';
import { useBankingData } from '../../../core/application/useBanking';
import { useRoutesData } from '../../../core/application/useRoutes';
import { PiggyBank, ArrowDownToLine, ArrowUpFromLine, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

export function BankingPage() {
  const { routes } = useRoutesData();
  const vesselIds = [...new Set(routes.map(r => r.routeId))];
  const availableYears = [...new Set(routes.map(r => r.year))].sort((a, b) => a - b);

  const [shipId, setShipId] = useState(vesselIds[0] || '');
  const [year, setYear] = useState(() => availableYears[0] ?? 2024);

  const { 
    records, 
    bankedBalance, 
    complianceData, 
    bankSurplus, 
    isBanking, 
    applyBanked, 
    isApplying 
  } = useBankingData(shipId, year);

  const [bankAmount, setBankAmount] = useState('');
  const [applyAmount, setApplyAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await bankSurplus(Number(bankAmount));
      setSuccess(`Successfully banked ${bankAmount} gCO₂eq`);
      setBankAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to bank surplus');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await applyBanked(Number(applyAmount));
      setSuccess(`Successfully applied ${applyAmount} gCO₂eq of banked balance`);
      setApplyAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to apply banked balance');
    }
  };

  const cbBefore = complianceData?.cb ?? 0;
  // If we applied some balance, the backend would actually just append a ledger row.
  // The 'adjustedCB' currently is cb + bankedBalance, which represents the maximum theoretical coverage,
  // but let's show KPIs matching the requirements:
  const isSurplus = cbBefore > 0;
  const isDeficit = cbBefore < 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Banking & Borrowing</h2>
        <p className="text-sm text-gray-500 mt-1">Manage FuelEU compliance balance banking (Article 20).</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex gap-4">
        <label className="flex flex-col gap-1 w-full sm:w-1/2">
          <span className="text-sm font-medium text-gray-700">Select Vessel</span>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={shipId} 
            onChange={(e) => setShipId(e.target.value)}
          >
            {vesselIds.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 w-full sm:w-1/2">
          <span className="text-sm font-medium text-gray-700">Compliance Year</span>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {shipId && complianceData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Base Compliance Balance</div>
              <div className={`text-3xl font-bold font-mono ${cbBefore >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-2`}>
                {cbBefore >= 0 ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                {cbBefore > 0 ? '+' : ''}{cbBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">gCO₂eq (Year {year})</div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center bg-gradient-to-br from-indigo-50 to-white">
              <div className="text-sm font-medium text-indigo-700 mb-1 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" /> Available Banked
              </div>
              <div className="text-3xl font-bold font-mono text-indigo-900 border-b border-indigo-200 pb-2 mb-2">
                {bankedBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-indigo-500 font-medium tracking-wide uppercase">Total Surplus Saved</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
              <div className="text-sm font-medium text-gray-500 mb-1">Adjusted Coverage Limit</div>
              <div className="text-3xl font-bold font-mono text-gray-900">
                {complianceData.adjustedCB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400 mt-1">Maximum theoretical CB (Base + Banked)</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex items-start gap-3 border border-green-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{success}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 px-5 py-4 border-b border-green-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Bank Surplus</h3>
                  <p className="text-xs text-green-700">Save positive balance for future years</p>
                </div>
                <ArrowUpFromLine className="w-6 h-6 text-green-600" />
              </div>
              <form onSubmit={handleBank} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Amount to Bank</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={isSurplus ? cbBefore : 0}
                    disabled={!isSurplus}
                    value={bankAmount}
                    onChange={e => setBankAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isSurplus || isBanking || !bankAmount}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isBanking ? 'Banking...' : 'Deposit to Bank'}
                </button>
                {!isSurplus && <p className="text-xs text-gray-500 text-center">No surplus available to bank this year.</p>}
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Apply Banked Balance</h3>
                  <p className="text-xs text-blue-700">Draw down to cover a deficit</p>
                </div>
                <ArrowDownToLine className="w-6 h-6 text-blue-600" />
              </div>
              <form onSubmit={handleApply} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Amount to Apply</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={Math.min(bankedBalance, isDeficit ? Math.abs(cbBefore) : 0)}
                    disabled={bankedBalance <= 0 || !isDeficit}
                    value={applyAmount}
                    onChange={e => setApplyAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bankedBalance <= 0 || isApplying || !applyAmount || !isDeficit}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isApplying ? 'Applying...' : 'Apply to Deficit'}
                </button>
                {bankedBalance <= 0 && <p className="text-xs text-gray-500 text-center">No banked balance available.</p>}
                {bankedBalance > 0 && !isDeficit && <p className="text-xs text-gray-500 text-center">Vessel is not in deficit this year.</p>}
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8 overflow-hidden">
             <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Ledger History</h3>
             </div>
             {records.length > 0 ? (
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-gray-100 text-gray-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Year</th>
                      <th className="px-6 py-3 font-medium text-right">Amount (gCO₂eq)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map(entry => (
                      <tr key={entry.id}>
                        <td className="px-6 py-3 font-medium">
                          <span className={`inline-flex px-2 py-1 rounded text-xs ${entry.type === 'BANKED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-600">{entry.year}</td>
                        <td className={`px-6 py-3 text-right font-mono ${entry.type === 'BANKED' ? 'text-green-600' : 'text-blue-600'}`}>
                          {entry.type === 'BANKED' ? '+' : '-'}{entry.amountGco2eq.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             ) : (
               <div className="p-8 text-center text-gray-500 text-sm">No banking records found for this vessel.</div>
             )}
          </div>
        </>
      )}
    </div>
  );
}
