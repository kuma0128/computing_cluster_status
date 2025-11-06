import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { ClustersListPage } from './pages/ClustersListPage';
import { ClusterDetailPage } from './pages/ClusterDetailPage';
import { Login } from './pages/Login';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Redirect root to clusters list */}
            <Route path="/" element={<Navigate to="/clusters" replace />} />

            {/* Clusters routes */}
            <Route path="/clusters" element={<ClustersListPage />} />
            <Route path="/clusters/:clusterId" element={<ClusterDetailPage />} />

            {/* Legacy dashboard route - keep for backwards compatibility */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
