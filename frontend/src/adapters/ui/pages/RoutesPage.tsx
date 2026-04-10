import { useState, useMemo } from 'react';
import { useRoutesData } from '../../../core/application/useRoutes';
import { Check, Star } from 'lucide-react';

export function RoutesPage() {
  const { routes, isLoading, isError, setBaseline, isSettingBaseline } = useRoutesData();

  const [filterVessel, setFilterVessel] = useState('');
  const [filterFuel, setFilterFuel] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (filterVessel && r.vesselType !== filterVessel) return false;
      if (filterFuel && r.fuelType !== filterFuel) return false;
      if (filterYear && r.year.toString() !== filterYear) return false;
      return true;
    });
  }, [routes, filterVessel, filterFuel, filterYear]);

  // Unique values for filter dropdowns
  const vesselTypes = [...new Set(routes.map((r) => r.vesselType))];
  const fuelTypes = [...new Set(routes.map((r) => r.fuelType))];
  const years = [...new Set(routes.map((r) => r.year))].sort((a, b) => a - b);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading routes...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load routes.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vessel Routes</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and set compliance baseline routes.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 flex-wrap items-end">
        <label className="flex flex-col gap-1 w-full sm:w-48">
          <span className="text-sm font-medium text-gray-700">Vessel Type</span>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={filterVessel} 
            onChange={(e) => setFilterVessel(e.target.value)}
          >
            <option value="">All Types</option>
            {vesselTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 w-full sm:w-48">
          <span className="text-sm font-medium text-gray-700">Fuel Type</span>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={filterFuel} 
            onChange={(e) => setFilterFuel(e.target.value)}
          >
            <option value="">All Fuels</option>
            {fuelTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 w-full sm:w-32">
          <span className="text-sm font-medium text-gray-700">Year</span>
          <select 
            className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={filterYear} 
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>
        </label>
        
        <button 
          onClick={() => { setFilterVessel(''); setFilterFuel(''); setFilterYear(''); }}
          className="text-sm text-primary hover:text-primary-light px-3 py-2"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-3">Route ID</th>
                <th className="px-6 py-3">Vessel & Fuel</th>
                <th className="px-6 py-3 text-right">GHG Intensity</th>
                <th className="px-6 py-3 text-right">Emissions (tCO₂eq)</th>
                <th className="px-6 py-3 text-center">Baseline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {route.routeId}
                    <div className="text-xs text-gray-400 font-normal">Year: {route.year}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{route.vesselType}</div>
                    <div className="text-gray-500 text-xs">{route.fuelType}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-gray-900">{route.ghgIntensity.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">gCO₂eq/MJ</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-mono text-gray-900">{route.totalEmissions.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{route.distance.toLocaleString()} nm / {route.fuelConsumption.toLocaleString()} t</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {route.isBaseline ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <Check className="w-3.5 h-3.5" /> Baseline
                      </span>
                    ) : (
                      <button
                        onClick={() => setBaseline(route.id)}
                        disabled={isSettingBaseline}
                         className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" /> Set Baseline
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No routes match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
