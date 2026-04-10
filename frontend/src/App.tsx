import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './adapters/ui/components/DashboardLayout';
import { RoutesPage } from './adapters/ui/pages/RoutesPage';
import { ComparePage } from './adapters/ui/pages/ComparePage';
import { BankingPage } from './adapters/ui/pages/BankingPage';
import { PoolingPage } from './adapters/ui/pages/PoolingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/routes" replace />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/banking" element={<BankingPage />} />
          <Route path="/pooling" element={<PoolingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
