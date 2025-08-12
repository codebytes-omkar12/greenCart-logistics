import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import RoutesPage from './pages/Routes';
import Orders from './pages/Orders';
import Simulations from './pages/Simulations';
import { api } from './api';
import './index.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Start with null to indicate loading
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check auth status with the server on initial load
    api.checkAuthStatus()
      .then(response => {
        setIsAuthenticated(response.data.isLoggedIn);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    // This effect runs after the auth check is complete
    if (isAuthenticated === false && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('/');
  };

  // Render a loading state while checking auth
  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToRegister={() => navigate('/register')} />} />
      <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
      
      {/* Render protected routes only if authenticated */}
      {isAuthenticated && (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/simulations" element={<Simulations />} />
        </Route>
      )}
    </Routes>
  );
};

export default App;