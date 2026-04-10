import { useCompareData } from '../../../core/application/useCompare';
import { Target, TrendingDown, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function ComparePage() {
  const { comparisonData, isLoading, isError, error } = useCompareData();
  const FUEL_EU_TARGET = 89.3368;

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading comparison data...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">{error?.message || 'Failed to load data.'}</div>;
  if (!comparisonData) return null;

  const { baseline, comparisons } = comparisonData;

  const chartData = comparisons.map((c) => ({
    name: c.route.routeId,
    ghgIntensity: c.route.ghgIntensity,
    vesselType: c.route.vesselType,
    fuelType: c.route.fuelType,
    isBaseline: c.route.isBaseline,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Comparison</h2>
          <p className="text-sm text-gray-500 mt-1">
            Comparing fleet performance against baseline route <span className="font-semibold text-gray-700">{baseline.routeId}</span>.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Regulatory Target</div>
            <div className="font-mono font-bold text-gray-900">{FUEL_EU_TARGET} <span className="text-xs text-gray-500 font-sans font-normal">gCO₂eq/MJ</span></div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100 text-sm">
                      <div className="font-bold text-gray-900 mb-1">{data.name} {data.isBaseline && '(Baseline)'}</div>
                      <div className="text-gray-600">{data.vesselType} • {data.fuelType}</div>
                      <div className="mt-2 font-mono">{parseFloat(data.ghgIntensity).toFixed(2)} gCO₂eq/MJ</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={baseline.ghgIntensity} stroke="#AA3BFF" strokeDasharray="3 3" label={{ position: 'top', value: 'Baseline', fill: '#AA3BFF', fontSize: 12 }} />
            <Bar 
              dataKey="ghgIntensity" 
              radius={[4, 4, 0, 0]}
              fill="#c084fc"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Route ID</th>
                <th className="px-6 py-3 text-right">GHG Intensity</th>
                <th className="px-6 py-3 text-right">Vs. Baseline</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisons.map(({ route, percentDiff, compliant }) => (
                <tr key={route.id} className={`transition-colors ${route.isBaseline ? 'bg-purple-50 hover:bg-purple-50/80' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {route.routeId} 
                      {route.isBaseline && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-200 text-purple-800">Baseline</span>}
                    </div>
                    <div className="text-xs text-gray-500">{route.vesselType} • {route.fuelType}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-gray-900">{route.ghgIntensity.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">gCO₂eq/MJ</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {route.isBaseline ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className={`font-mono flex justify-end items-center gap-1 ${percentDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {percentDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {Math.abs(percentDiff).toFixed(2)}%
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {compliant ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> Exceeds
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
