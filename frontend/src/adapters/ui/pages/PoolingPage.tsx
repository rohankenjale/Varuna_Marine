import { useState, useMemo } from 'react';
import { usePoolingData } from '../../../core/application/usePooling';
import { useRoutesData } from '../../../core/application/useRoutes';
import { Users, AlertCircle, ArrowRight, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export function PoolingPage() {
  const { ships, isLoadingShips, isErrorShips, createPool, isCreatingPool, poolResult, poolError } = usePoolingData();
  
  const [selectedShips, setSelectedShips] = useState<Set<string>>(new Set());

  const toggleShipSelection = (shipId: string) => {
    const next = new Set(selectedShips);
    if (next.has(shipId)) {
      next.delete(shipId);
    } else {
      next.add(shipId);
    }
    setSelectedShips(next);
  };

  const selectedShipsData = useMemo(() => {
    return ships.filter(s => selectedShips.has(s.shipId));
  }, [ships, selectedShips]);

  const poolSum = useMemo(() => {
    return selectedShipsData.reduce((sum, ship) => sum + ship.adjustedCB, 0);
  }, [selectedShipsData]);

  const isValidPool = poolSum >= 0 && selectedShips.size >= 2;

  const handleCreatePool = async () => {
    if (!isValidPool) return;
    
    const members = selectedShipsData.map(s => ({
      shipId: s.shipId,
      adjustedCB: s.adjustedCB,
    }));
    
    try {
      await createPool(members);
      setSelectedShips(new Set());
    } catch (e) {
      // Error is handled by poolError state from the hook
    }
  };

  if (isLoadingShips) return <div className="p-8 text-center text-gray-500">Loading fleet data...</div>;
  if (isErrorShips) return <div className="p-8 text-center text-red-500">Failed to load fleet data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance Pooling</h2>
          <p className="text-sm text-gray-500 mt-1">Form pools to share compliance balance across vessels (Article 21).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 line-clamp-none">
        
        {/* Left Column: Fleet Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Available Fleet</h3>
              <p className="text-xs text-gray-500">Select vessels to include in the pool. Available CB represents Base CB + Banked Surplus.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium w-12">Select</th>
                    <th className="px-6 py-3 font-medium">Vessel ID</th>
                    <th className="px-6 py-3 font-medium text-right">Adjusted CB (gCO₂eq)</th>
                    <th className="px-6 py-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ships.map(ship => {
                    const isSelected = selectedShips.has(ship.shipId);
                    return (
                      <tr 
                        key={ship.shipId} 
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleShipSelection(ship.shipId)}
                      >
                        <td className="px-6 py-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-900">{ship.shipId}</td>
                        <td className="px-6 py-3 text-right font-mono">
                          {ship.adjustedCB > 0 ? '+' : ''}{ship.adjustedCB.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-6 py-3 text-center flex justify-center">
                          {ship.adjustedCB >= 0 ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full"><TrendingUp className="w-3 h-3"/> Surplus</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full"><TrendingDown className="w-3 h-3"/> Deficit</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {poolError && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{(poolError as Error).message || 'Failed to create pool'}</div>
            </div>
          )}

          {poolResult && (
            <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 overflow-hidden">
               <div className="px-5 py-4 border-b border-green-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Pool Created Successfully
                  </h3>
                  <p className="text-xs text-green-700">ID: {poolResult.poolId}</p>
                </div>
              </div>
              <div className="p-5">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-green-800 border-b border-green-200">
                    <tr>
                      <th className="py-2">Vessel</th>
                      <th className="py-2 text-right">Entered With</th>
                      <th className="py-2 text-right">Exited With</th>
                      <th className="py-2 text-right">Net Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {poolResult.members.map(m => {
                      const diff = m.cbAfter - m.cbBefore;
                      return (
                        <tr key={m.shipId}>
                          <td className="py-3 font-medium text-green-900">{m.shipId}</td>
                          <td className="py-3 text-right font-mono text-green-800">{m.cbBefore.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="py-3 text-right font-mono font-bold text-green-900">{m.cbAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className={`py-3 text-right font-mono font-medium ${diff > 0 ? 'text-blue-600' : diff < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {diff > 0 ? '+' : ''}{diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pool Configuration */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="bg-primary/5 px-5 py-4 border-b border-primary/10 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <h3 className="font-semibold text-primary">Pool Configuration</h3>
            </div>
            
            <div className="p-5 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Selected Vessels</span>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selectedShips.size}</span>
                </div>
                {selectedShips.size === 0 ? (
                  <div className="text-xs text-gray-400 italic">No vessels selected</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedShipsData.map(s => (
                      <span key={s.shipId} className={`text-xs px-2 py-1 rounded-md border ${s.adjustedCB >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {s.shipId}
                      </span>
                    ))}
                  </div>
                )}
                {selectedShips.size === 1 && <div className="text-xs text-orange-600 mt-2">At least 2 vessels required.</div>}
              </div>

              <div>
                <span className="text-sm font-medium text-gray-700 block mb-2">Projected Pool Sum</span>
                <div className={`p-4 rounded-lg flex items-center justify-between border ${poolSum >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {poolSum >= 0 ? <TrendingUp className="w-6 h-6 text-green-600" /> : <TrendingDown className="w-6 h-6 text-red-600" />}
                  <span className={`text-2xl font-mono font-bold ${poolSum >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {poolSum > 0 ? '+' : ''}{poolSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {poolSum < 0 && <div className="text-xs text-red-600 mt-2">Pool sum must be ≥ 0. Add more surplus vessels.</div>}
              </div>

              <button
                onClick={handleCreatePool}
                disabled={!isValidPool || isCreatingPool}
                className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary-light disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isCreatingPool ? 'Processing Allocation...' : 'Execute Greedy Allocation'}
                {!isCreatingPool && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
